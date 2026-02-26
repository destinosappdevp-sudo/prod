-- Script para actualizar el rol del usuario a HOST
UPDATE "User"
SET role = 'HOST'
WHERE email = 'restaurant1@demo.com';
