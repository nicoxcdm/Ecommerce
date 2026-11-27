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

// GET /api/laboratories
router.get("/", async (_req, res, next) => {
  try {
    const labs = await prisma.ecommerceLaboratory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    res.json(
      labs.map((l) => ({
        laboratorio_id: l.id,
        id: l.id,
        name: l.name,
        slug: l.slug,
        description: l.description,
        logoUrl: l.logoUrl,
        productCount: l._count.products,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/laboratories (ADMIN / DIRECTORA)
router.post("/", requireAuth, requireEcommerceAdmin, async (req, res, next) => {
  try {
    const { name, description, logoUrl } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "El nombre del laboratorio es obligatorio" });
    }
    const cleanName = String(name).trim();
    const slug = slugify(cleanName);

    const created = await prisma.ecommerceLaboratory.create({
      data: {
        name: cleanName,
        slug,
        description: description || null,
        logoUrl: logoUrl || null,
      },
    });

    res.status(201).json({
      laboratorio_id: created.id,
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      logoUrl: created.logoUrl,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Ya existe un laboratorio con ese nombre" });
    }
    next(err);
  }
});

module.exports = router;
