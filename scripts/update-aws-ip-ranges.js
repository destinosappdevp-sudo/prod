#!/usr/bin/env node
/**
 * Script para descargar y procesar los rangos de IP de AWS donde corre Vercel.
 *
 * Vercel ejecuta funciones serverless en AWS (us-east-1, us-west-2, eu-west-1)
 * y usa CloudFront como CDN. Esta lista cambia frecuentemente.
 *
 * Fuente oficial: https://ip-ranges.amazonaws.com/ip-ranges.json
 *
 * Uso:
 *   node scripts/update-aws-ip-ranges.js
 *
 * Salida:
 *   - docs/vercel-aws-ip-ranges.txt (CIDR ranges)
 *   - docs/vercel-aws-ip-ranges.md (Markdown con instrucciones)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const VERCEL_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];
const AWS_IP_RANGES_URL = "https://ip-ranges.amazonaws.com/ip-ranges.json";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("[update-aws-ip-ranges] Descargando rangos de IP de AWS...");

  const data = await fetchJson(AWS_IP_RANGES_URL);

  // EC2 (funciones serverless)
  const ec2Ranges = data.prefixes
    .filter((p) => p.service === "EC2" && VERCEL_REGIONS.includes(p.region))
    .map((p) => p.ip_prefix);

  // CloudFront (capa CDN)
  const cfRanges = data.prefixes
    .filter((p) => p.service === "CLOUDFRONT" && VERCEL_REGIONS.includes(p.region))
    .map((p) => p.ip_prefix);

  // IPv6
  const ipv6Ranges = (data.ipv6_prefixes || [])
    .filter(
      (p) =>
        (p.service === "EC2" || p.service === "CLOUDFRONT") &&
        VERCEL_REGIONS.includes(p.region)
    )
    .map((p) => p.ipv6_prefix);

  console.log(`[update-aws-ip-ranges] EC2 (IPv4): ${ec2Ranges.length}`);
  console.log(`[update-aws-ip-ranges] CloudFront (IPv4): ${cfRanges.length}`);
  console.log(`[update-aws-ip-ranges] IPv6: ${ipv6Ranges.length}`);

  const allRanges = [...new Set([...ec2Ranges, ...cfRanges, ...ipv6Ranges])].sort();

  const docsDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Guardar lista de CIDR
  const txtPath = path.join(docsDir, "vercel-aws-ip-ranges.txt");
  fs.writeFileSync(txtPath, allRanges.join("\n"));
  console.log(`[update-aws-ip-ranges] Guardado en: ${txtPath}`);

  // Guardar resumen Markdown
  const mdPath = path.join(docsDir, "vercel-aws-ip-ranges-summary.md");
  const today = new Date().toISOString().split("T")[0];
  const mdContent = `# Resumen de Rangos IP de AWS (Vercel)

> **Última actualización**: ${today}
> **Total rangos**: ${allRanges.length}

## Regiones incluidas
- \`us-east-1\` (iad1 - Virginia)
- \`us-west-2\` (sfo1 - Oregon)
- \`eu-west-1\` (cdg1 - Paris)

## Servicios incluidos
- **EC2**: Funciones serverless
- **CloudFront**: Capa CDN
- **IPv4 + IPv6**

## Uso para whitelist bancario

Si el banco de la pasarela R4 pide IPs para whitelist, proporcionar:

### Opción A: Solo CloudFront (más restrictivo - recomendado)
Ver archivo \`vercel-aws-ip-ranges.txt\` y filtrar por líneas comentadas con # CLOUDFRONT.

### Opción B: Toda la lista (más permisivo)
Todo el contenido de \`vercel-aws-ip-ranges.txt\`.

### Opción C: Por región específica
Usar solo los rangos de la región donde está desplegada la app
(usualmente us-east-1 para la mayoría de deployments de Vercel).

## Nota importante

Vercel NO publica una lista oficial de IPs. Esta lista se deriva de los rangos
publicados por AWS (\`ip-ranges.amazonaws.com\`). Si Vercel cambia su
infraestructura, esta lista podría quedar desactualizada.

**Alternativa recomendada**: Solicitar al banco verificación por HMAC + authToken
en lugar de whitelist por IP.
`;

  fs.writeFileSync(mdPath, mdContent);
  console.log(`[update-aws-ip-ranges] Resumen guardado en: ${mdPath}`);

  console.log("[update-aws-ip-ranges] ✅ Listo");
}

main().catch((err) => {
  console.error("[update-aws-ip-ranges] Error:", err);
  process.exit(1);
});
