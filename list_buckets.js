
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

async function listBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Faltan variables de entorno");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    realtime: { transport: ws }
  });
  
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("Error al listar buckets:", error.message);
    process.exit(1);
  }

  const names = data.map(b => b.name);
  console.log("Buckets:", names.join(", "));
  console.log("Existe images:", names.includes("images"));
}

listBuckets();

