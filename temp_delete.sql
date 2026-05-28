-- ============================================================
-- LIMPIEZA COMPLETA DE USUARIO + ASIENTOS
-- Reemplaza 'david.genex@gmail.com' por el email que necesites.
-- ============================================================

BEGIN;

-- 1. Borrar pagos de las reservas del usuario
WITH target_user AS (
  SELECT id FROM "User" WHERE email = 'david.genex@gmail.com'
),
target_reservations AS (
  SELECT r.id FROM "Reservation" r
  JOIN target_user u ON r."userId" = u.id
),
deleted_payments AS (
  DELETE FROM "Payment"
  WHERE "reservationId" IN (SELECT id FROM target_reservations)
  RETURNING id
),
deleted_reservations AS (
  DELETE FROM "Reservation"
  WHERE id IN (SELECT id FROM target_reservations)
  RETURNING id
),
deleted_savings AS (
  DELETE FROM "Saving"
  WHERE "userId" IN (SELECT id FROM target_user)
  RETURNING id
)
SELECT
  (SELECT COUNT(*) FROM deleted_payments)     AS pagos_borrados,
  (SELECT COUNT(*) FROM deleted_reservations) AS reservas_borradas,
  (SELECT COUNT(*) FROM deleted_savings)      AS ahorros_borrados;

-- 2. Cancelar reservas PENDING con monto cero del usuario
--    (ejecutado después para ver el estado actualizado)
UPDATE "Reservation"
SET status = 'CANCELLED'
WHERE status = 'PENDING'
  AND "totalAmount" = 0
  AND "userId" = (SELECT id FROM "User" WHERE email = 'david.genex@gmail.com');

-- 3. Liberar asientos ocupados sin reserva activa ni ahorro vigente
--    (ejecutado después de los DELETEs para ver su efecto)
UPDATE "PackageSeat" ps
SET status = 'AVAILABLE'
WHERE ps.status = 'OCCUPIED'
  AND NOT EXISTS (
    SELECT 1 FROM "Reservation" r
    WHERE r."seatId" = ps.id
      AND r.status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Saving" s
    WHERE s."paymentDetails"->>'seatId' = ps.id
      AND s.status IN ('PENDING', 'APPROVED')
  )
RETURNING ps.id, ps."homeId", ps."row", ps."column", ps.status;

COMMIT;
