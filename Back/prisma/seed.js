require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = [
    { name: "Laboratorios", slug: "laboratorios", description: "Productos y fórmulas de laboratorio" },
    { name: "Aparatología", slug: "aparatologia", description: "Equipos profesionales de estética" },
    { name: "Cosméticos", slug: "cosmeticos", description: "Líneas cosméticas profesionales" },
    { name: "Insumos", slug: "insumos", description: "Insumos descartables y de gabinete" },
    { name: "Cuidado Facial", slug: "cuidado-facial", description: "Sérums, cremas y protocolos faciales" },
    { name: "Cuidado Corporal", slug: "cuidado-corporal", description: "Tratamientos corporales profesionales" },
  ];

  // Renombrar "Laboratorio" a "Laboratorios" si ya existía en la BD
  const oldLab = await prisma.ecommerceCategory.findUnique({ where: { slug: "laboratorio" } });
  if (oldLab) {
    await prisma.ecommerceCategory.update({
      where: { id: oldLab.id },
      data: { name: "Laboratorios", slug: "laboratorios" },
    });
  }

  // Renombrar "Cosmecéuticos" a "Cosméticos" si ya existía en la BD
  const oldCat = await prisma.ecommerceCategory.findUnique({ where: { slug: "cosmeceuticos" } });
  if (oldCat) {
    await prisma.ecommerceCategory.update({
      where: { id: oldCat.id },
      data: { name: "Cosméticos", slug: "cosmeticos", description: "Líneas cosméticas profesionales" },
    });
  }

  for (const cat of defaultCategories) {
    await prisma.ecommerceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Categorías iniciales del E-Commerce listas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
