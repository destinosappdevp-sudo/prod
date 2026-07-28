/**
 * Script para verificar y corregir datos inconsistentes en paquetes
 * Ejecutar: node scripts/check-private-packages.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Verificando paquetes con datos inconsistentes...\n');

  // 1. Paquetes con isPrivate=true pero sin privateOwnerId
  const privateWithoutOwner = await prisma.home.findMany({
    where: {
      isPrivate: true,
      privateOwnerId: null,
    },
    select: {
      id: true,
      title: true,
      isPrivate: true,
      privateOwnerId: true,
    },
  });

  if (privateWithoutOwner.length > 0) {
    console.log(` ${privateWithoutOwner.length} paquetes con isPrivate=true pero sin owner:`);
    privateWithoutOwner.forEach((p) => {
      console.log(`   - ${p.id}: ${p.title}`);
    });
    console.log();
  }

  // 2. Paquetes con privateOwnerId pero isPrivate=false
  const ownerWithoutPrivate = await prisma.home.findMany({
    where: {
      isPrivate: false,
      privateOwnerId: { not: null },
    },
    select: {
      id: true,
      title: true,
      isPrivate: true,
      privateOwnerId: true,
    },
  });

  if (ownerWithoutPrivate.length > 0) {
    console.log(`⚠️  ${ownerWithoutPrivate.length} paquetes con owner pero isPrivate=false:`);
    ownerWithoutPrivate.forEach((p) => {
      console.log(`   - ${p.id}: ${p.title} (owner: ${p.privateOwnerId})`);
    });
    console.log();
  }

  // 3. Verificar transportType (todos deben tener un valor por defecto)
  console.log('️  transportType tiene valor por defecto (ENC32), no se requiere verificación\n');

  // 4. Verificar que todos los privateOwnerId existan en la tabla User
  const packagesWithOwner = await prisma.home.findMany({
    where: {
      privateOwnerId: { not: null },
    },
    select: {
      id: true,
      title: true,
      privateOwnerId: true,
    },
  });

  const invalidOwners = [];
  for (const pkg of packagesWithOwner) {
    const user = await prisma.user.findUnique({
      where: { id: pkg.privateOwnerId },
    });
    if (!user) {
      invalidOwners.push(pkg);
    }
  }

  if (invalidOwners.length > 0) {
    console.log(`❌ ${invalidOwners.length} paquetes con privateOwnerId inválido:`);
    invalidOwners.forEach((p) => {
      console.log(`   - ${p.id}: ${p.title} (owner: ${p.privateOwnerId})`);
    });
    console.log();
  }

  console.log('✅ Verificación completada');

  // Opción para corregir automáticamente
  const shouldFix = process.argv.includes('--fix');
  if (shouldFix) {
    console.log('\n Corrigiendo datos inconsistentes...\n');

    // Corregir paquetes con isPrivate=true pero sin owner
    for (const pkg of privateWithoutOwner) {
      await prisma.home.update({
        where: { id: pkg.id },
        data: { isPrivate: false },
      });
      console.log(`   ✓ ${pkg.id}: isPrivate cambiado a false`);
    }

    // Corregir paquetes con owner pero isPrivate=false
    for (const pkg of ownerWithoutPrivate) {
      await prisma.home.update({
        where: { id: pkg.id },
        data: { isPrivate: true },
      });
      console.log(`   ✓ ${pkg.id}: isPrivate cambiado a true`);
    }

    console.log('\n✅ Corrección completada');
  } else {
    console.log('\n Ejecuta con --fix para corregir automáticamente:');
    console.log('   node scripts/check-private-packages.js --fix');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
