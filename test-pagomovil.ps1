# Test manual de webhooks R4
# Actualiza las variables de abajo antes de ejecutar

$BASE_URL = "http://localhost:3000"
$HMAC_SECRET = "tu_hmac_secret_aqui"
$CEDULA = "13536734"
$MONTO = "135.36"
$TEL_COM = "04120736383"

function Get-HmacHex {
    param([string]$Secret, [string]$Payload)
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Secret))
    try {
        $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Payload))
        return -join ($hash | ForEach-Object { $_.ToString("x2") })
    } finally { $hmac.Dispose() }
}

function New-SignedHeaders {
    param([string]$Payload)
    return @{
        "Content-Type"  = "application/json"
        "Authorization" = "HMAC $(Get-HmacHex -Secret $HMAC_SECRET -Payload $Payload)"
    }
}

Write-Host "=== TEST 1: R4consulta ===" -ForegroundColor Cyan
$body1 = @{ IdCliente = $CEDULA; Monto = $MONTO; TelefonoComercio = $TEL_COM } | ConvertTo-Json
$headers = New-SignedHeaders -Payload $body1
Invoke-RestMethod -Uri "$BASE_URL/R4consulta" -Method POST -Headers $headers -Body $body1

Write-Host "`n=== TEST 2: R4notifica ===" -ForegroundColor Cyan
$REF = "TEST" + (Get-Random -Minimum 10000000 -Maximum 99999999)
$body2 = @{
    IdComercio = $HMAC_SECRET.Substring(0, 8); TelefonoComercio = $TEL_COM
    TelefonoEmisor = "04145555555"; BancoEmisor = "0134"
    Monto = $MONTO; Referencia = $REF; CodigoRed = "00"
} | ConvertTo-Json
$headers = New-SignedHeaders -Payload $body2
Invoke-RestMethod -Uri "$BASE_URL/R4notifica" -Method POST -Headers $headers -Body $body2

Write-Host "`n=== TEST 3: R4notifica con CodigoRed != 00 ===" -ForegroundColor Cyan
$body3 = @{
    IdComercio = $HMAC_SECRET.Substring(0, 8); TelefonoComercio = $TEL_COM
    TelefonoEmisor = "04145555555"; BancoEmisor = "0134"
    Monto = $MONTO; Referencia = "TESTREJECT"; CodigoRed = "01"
} | ConvertTo-Json
$headers = New-SignedHeaders -Payload $body3
Invoke-RestMethod -Uri "$BASE_URL/R4notifica" -Method POST -Headers $headers -Body $body3
