const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.property_types.findMany({ orderBy: { id: "asc" } })
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .finally(() => p.$disconnect());



