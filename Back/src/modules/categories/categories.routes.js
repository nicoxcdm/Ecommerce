const express = require("express");
const { prisma } = require("../../db/prisma");
const { requireAuth, requireEcommerceAdmin } = require("../../middlewares/auth");

const router = express.Router();

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/categories
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.ecommerceCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    const formatted = categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: c._count.products,
      }))
      .sort((a, b) => {
        if (a.slug === "laboratorios") return -1;
        if (b.slug === "laboratorios") return 1;
        return a.name.localeCompare(b.name, "es");
      });
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories (ADMIN / DIRECTORA)
router.post("/", requireAuth, requireEcommerceAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
    }
    const cleanName = String(name).trim();
    const slug = slugify(cleanName);

    const created = await prisma.ecommerceCategory.create({
      data: { name: cleanName, slug, description: description || null },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    }
    next(err);
  }
});

module.exports = router;
