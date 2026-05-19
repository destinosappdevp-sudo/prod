const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Aprobando todas las propiedades...\n');
    
    // Obtener todas las propiedades en DRAFT
    const draftHomes = await prisma.home.findMany({
      where: {
        publishStatus: 'DRAFT'
      },
      select: {
        id: true,
        title: true,
        User: {
          select: {
            email: true,
          }
        }
      },
    });

    console.log(`📋 Propiedades en DRAFT: ${draftHomes.length}\n`);

    if (draftHomes.length === 0) {
      console.log('✅ No hay propiedades por aprobar');
      return;
    }

    // Aprobar todas las propiedades
    const result = await prisma.home.updateMany({
      where: {
        publishStatus: 'DRAFT'
      },
      data: {
        publishStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log(`✅ ${result.count} propiedades aprobadas exitosamente\n`);

    // Mostrar las propiedades aprobadas
    draftHomes.forEach((home, index) => {
      console.log(`${index + 1}. ${home.title || 'Sin título'} - ${home.User?.email || 'Sin usuario'}`);
    });

    console.log('\n✨ Todas las propiedades ahora están aprobadas y deberían aparecer en los listados');

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



