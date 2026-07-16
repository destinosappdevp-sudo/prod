-- AlterTable: Add Pago Móvil R4 config columns to PlatformConfig
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilMode" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilPhone" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilBank" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilCedula" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilIdComercio" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilHmacSecret" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilAuthToken" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilAllowedIps" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilCreditoIdComercio" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilCreditoHmacSecret" TEXT;
ALTER TABLE "PlatformConfig" ADD COLUMN "pagomovilCreditoAuthToken" TEXT;

-- CreateEnum: Add BINANCE and ZINLI to PaymentMethod
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BINANCE';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ZINLI';

-- CreateTable: PagoMovilNotificacion
CREATE TABLE "PagoMovilNotificacion" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "referencia" TEXT NOT NULL,
    "idComercio" TEXT,
    "telefonoComercio" TEXT,
    "telefonoEmisor" TEXT,
    "bancoEmisor" TEXT,
    "monto" DOUBLE PRECISION,
    "codigoRed" TEXT,
    "paymentId" TEXT,
    "abonado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoMovilNotificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique index on referencia
CREATE UNIQUE INDEX "PagoMovilNotificacion_referencia_key" ON "PagoMovilNotificacion"("referencia");

-- CreateTable: R4JsonLog
CREATE TABLE "R4JsonLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tipo" TEXT NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "clientIp" TEXT,
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "R4JsonLog_pkey" PRIMARY KEY ("id")
);
