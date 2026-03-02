const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Buscando hosts verificados...');
    
    // Obtener todos los hosts verificados
    const verifiedHosts = await prisma.user.findMany({
      where: {
        role: 'HOST',
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`✅ Encontrados ${verifiedHosts.length} hosts verificados`);

    for (const host of verifiedHosts) {
      console.log(`\n📝 Procesando host: ${host.firstName} ${host.lastName} (${host.email})`);
      
      // Contar propiedades no aprobadas
      const pendingHomes = await prisma.home.count({
        where: {
          userId: host.id,
          publishStatus: {
            not: 'APPROVED'
          }
        }
      });

      if (pendingHomes > 0) {
        // Aprobar todas las propiedades pendientes
        const result = await prisma.home.updateMany({
          where: {
            userId: host.id,
            publishStatus: {
              not: 'APPROVED'
            }
          },
          data: {
            publishStatus: 'APPROVED',
            approvedAt: new Date(),
          },
        });

        console.log(`   ✅ ${result.count} propiedades aprobadas`);
      } else {
        console.log(`   ℹ️  No hay propiedades pendientes de aprobación`);
      }
    }

    console.log('\n✅ Script completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
