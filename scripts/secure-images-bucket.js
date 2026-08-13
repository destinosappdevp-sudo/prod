const { PrismaClient } = require("@prisma/client");

const ENV_FILE = process.env.ENV_FILE || ".env";
require("dotenv").config({ path: ENV_FILE, override: true });

// Apunta a STAGING (.env) por defecto. Para PROD usar ENV_FILE=.env.local.
const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = process.env.BUCKET || "images";
const MODE = process.env.MODE || "inspect"; // inspect | apply

async function main() {
  if (!DB_URL || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("Faltan variables de entorno (DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }
  console.log("Target Supabase:", SUPABASE_URL);

  const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Estado del bucket (GET /storage/v1/bucket/:id)
    const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, { headers });
    console.log(`\n=== Bucket "${BUCKET}" ===`);
    if (!bucketRes.ok) {
      console.log("getBucket status:", bucketRes.status, await bucketRes.text());
    } else {
      console.log(JSON.stringify(await bucketRes.json(), null, 2));
    }

    // 2. Políticas de storage
    const policies = await prisma.$queryRawUnsafe(
      "SELECT policyname, tablename, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'storage' ORDER BY tablename, policyname"
    );
    console.log(`\n=== Storage Policies (${policies.length}) ===`);
    for (const p of policies) {
      console.log(JSON.stringify({
        table: p.tablename,
        name: p.policyname,
        cmd: p.cmd,
        roles: p.roles,
        qual: p.qual,
      }));
    }

    if (MODE === "apply") {
      // 3. Volver el bucket privado (PUT /storage/v1/bucket/:id)
      const updateRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ public: false }),
      });
      if (!updateRes.ok) console.error("updateBucket status:", updateRes.status, await updateRes.text());
      else console.log(`\nBucket "${BUCKET}" actualizado a public=false`);

      // 4. Eliminar políticas de storage.objects para roles no-admin
      const dropStatements = [];
      for (const p of policies) {
        if (p.tablename !== "objects") continue;
        const roles = Array.isArray(p.roles) ? p.roles : [p.roles];
        const hasNonAdminRole = roles.some((r) => {
          const role = String(r).toLowerCase();
          return role === "public" || role === "anon" || role === "authenticated";
        });
        if (hasNonAdminRole) {
          dropStatements.push(`DROP POLICY IF EXISTS "${p.policyname}" ON storage.objects`);
        }
      }
      for (const stmt of dropStatements) {
        try {
          await prisma.$queryRawUnsafe(stmt);
          console.log("OK:", stmt);
        } catch (e) {
          console.log("FAIL:", stmt, "-", e.message);
        }
      }
      console.log(`\nPolicies no-admin en storage.objects eliminadas: ${dropStatements.length}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
