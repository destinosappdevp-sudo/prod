# Resumen de Rangos IP de AWS (Vercel)

> **Última actualización**: 2026-07-27
> **Total rangos**: 1083

## Regiones incluidas
- `us-east-1` (iad1 - Virginia)
- `us-west-2` (sfo1 - Oregon)
- `eu-west-1` (cdg1 - Paris)

## Servicios incluidos
- **EC2**: Funciones serverless
- **CloudFront**: Capa CDN
- **IPv4 + IPv6**

## Uso para whitelist bancario

Si el banco de la pasarela R4 pide IPs para whitelist, proporcionar:

### Opción A: Solo CloudFront (más restrictivo - recomendado)
Ver archivo `vercel-aws-ip-ranges.txt` y filtrar por líneas comentadas con # CLOUDFRONT.

### Opción B: Toda la lista (más permisivo)
Todo el contenido de `vercel-aws-ip-ranges.txt`.

### Opción C: Por región específica
Usar solo los rangos de la región donde está desplegada la app
(usualmente us-east-1 para la mayoría de deployments de Vercel).

## Nota importante

Vercel NO publica una lista oficial de IPs. Esta lista se deriva de los rangos
publicados por AWS (`ip-ranges.amazonaws.com`). Si Vercel cambia su
infraestructura, esta lista podría quedar desactualizada.

**Alternativa recomendada**: Solicitar al banco verificación por HMAC + authToken
en lugar de whitelist por IP.
