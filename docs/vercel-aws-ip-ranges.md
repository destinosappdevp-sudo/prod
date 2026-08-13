# Rangs CIDR de AWS donde corre Vercel

> **NOTA**: Vercel ejecuta funciones serverless en AWS (us-east-1, us-west-2, eu-west-1)
> y usa CloudFront como CDN. Esta lista NO es fija y puede cambiar.
>
> **Fuente**: https://ip-ranges.amazonaws.com/ip-ranges.json
> **Última actualización**: 2026-07-27

## Rangos CloudFront (capa CDN - la más importante para webhooks)

```
18.200.212.0/23
52.212.248.0/26
3.231.2.0/25
3.234.232.224/27
3.236.169.192/26
3.236.48.0/23
34.195.252.0/24
34.226.14.0/24
44.220.194.0/23
44.220.196.0/23
44.220.198.0/23
44.220.200.0/23
44.220.202.0/23
44.222.66.0/24
34.216.51.0/25
34.223.12.224/27
34.223.80.192/26
35.162.63.192/26
35.167.191.128/26
35.93.168.0/23
35.93.170.0/23
35.93.172.0/23
44.227.178.0/24
44.234.108.128/25
44.234.90.252/30
```

## IP específica que responde a www.verdemo.website

```
64.29.17.0/24   (Amazon AS16509 - Walnut, CA - anycast)
216.198.79.0/24 (Amazon AS16509 - Walnut, CA - anycast)
```

## Recomendación para whitelist bancario

Si el banco pide IPs específicas para la pasarela R4:

### OPCIÓN 1 (Recomendada - Más segura)
Solicitar al banco que use **verificación por HMAC + authToken** en lugar de IP whitelist.
Estos son únicos por cliente y no cambian.

### OPCIÓN 2 (Pruebas iniciales)
Pedirle al banco que abra su whitelist a:
- Cualquier IP de AWS us-east-1, us-west-2, eu-west-1
- O específicamente CloudFront

### OPCIÓN 3 (Lista completa para whitelist estricto)
Usar el script `scripts/update-aws-ip-ranges.js` para regenerar la lista completa de
rangos EC2 + CloudFront (más de 500 rangos).
