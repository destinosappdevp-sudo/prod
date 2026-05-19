const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Revisando estado de propiedades...\n');
    
    // Obtener estadísticas de estado de publicación
    const homes = await prisma.home.findMany({
      select: {
        id: true,
        title: true,
        publishStatus: true,
        User: {
          select: {
            email: true,
            role: true,
            isVerified: true,
          }
        }
      },
    });

    console.log(`📊 Total de propiedades: ${homes.length}\n`);

    // Agrupar por estado
    const byStatus = homes.reduce((acc, home) => {
      acc[home.publishStatus] = (acc[home.publishStatus] || 0) + 1;
      return acc;
    }, {});

    console.log('Estado de publicación:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n📋 Detalle de propiedades:');
    homes.forEach(home => {
      console.log(`\n  ID: ${home.id}`);
      console.log(`  Título: ${home.title || 'Sin título'}`);
      console.log(`  Estado: ${home.publishStatus}`);
      console.log(`  Host: ${home.User?.email || 'Sin usuario'}`);
      console.log(`  Rol: ${home.User?.role || 'N/A'}`);
      console.log(`  Verificado: ${home.User?.isVerified ? 'Sí' : 'No'}`);
    });

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



