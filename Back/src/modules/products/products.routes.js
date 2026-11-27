const express = require("express");
const { prisma } = require("../../db/prisma");
const { requireAuth, requireEcommerceAdmin } = require("../../middlewares/auth");

const router = express.Router();

function formatProduct(p) {
  const reviews = p.reviews || [];
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    listPrice: p.listPrice,
    imageUrl: p.imageUrl,
    images: p.images || [],
    stock: p.stock,
    isActive: p.isActive,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    createdAt: p.createdAt,
    reviewCount,
    averageRating,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: r.user
        ? {
            id: r.user.id,
            name: `${r.user.firstName} ${r.user.lastName}`.trim(),
            role: r.user.role,
          }
        : { name: "Usuario" },
    })),
  };
}

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, onSale, sort } = req.query;

    const where = { isActive: true };

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      const catId = Number(category);
      if (!Number.isNaN(catId)) {
        where.categoryId = catId;
      } else {
        where.category = { slug: String(category) };
      }
    }

    if (minPrice !== undefined && minPrice !== "") {
      where.price = { ...(where.price || {}), gte: Number(minPrice) };
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      where.price = { ...(where.price || {}), lte: Number(maxPrice) };
    }

    let orderBy = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "name_asc") orderBy = { name: "asc" };

    let products = await prisma.ecommerceProduct.findMany({
      where,
      orderBy,
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (onSale === "true") {
      products = products.filter((p) => p.listPrice && p.listPrice > p.price);
    }

    let formatted = products.map(formatProduct);
    if (sort === "rating_desc") {
      formatted.sort((a, b) => b.averageRating - a.averageRating);
    }

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const product = await prisma.ecommerceProduct.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(formatProduct(product));
  } catch (err) {
    next(err);
  }
});

// POST /api/products (ADMIN / DIRECTORA)
router.post("/", requireAuth, requireEcommerceAdmin, async (req, res, next) => {
  try {
    const { name, description, price, listPrice, imageUrl, images, categoryId, stock } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "El nombre del producto es obligatorio" });
    }
    if (price === undefined || Number.isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a 0" });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const cleanImageUrl =
      imageUrl && String(imageUrl).trim()
        ? String(imageUrl).trim()
        : "/assets/products/placeholder.svg";

    const extraImages = Array.isArray(images)
      ? images.map((img) => String(img).trim()).filter(Boolean)
      : [];

    const created = await prisma.ecommerceProduct.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        price: Number(price),
        listPrice: listPrice !== undefined && listPrice !== "" && listPrice !== null ? Number(listPrice) : null,
        imageUrl: cleanImageUrl,
        images: extraImages,
        stock: stock !== undefined && stock !== "" ? Number(stock) : 10,
        categoryId: categoryId ? Number(categoryId) : null,
        createdById: req.user.id,
      },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    });

    res.status(201).json(formatProduct(created));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (ADMIN / DIRECTORA)
router.delete("/:id", requireAuth, requireEcommerceAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    await prisma.ecommerceProduct.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/reviews (Authenticated user)
router.post("/:id/reviews", requireAuth, async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const { rating, comment } = req.body || {};

    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }
    const numRating = Number(rating);
    if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "La calificación debe estar entre 1 y 5" });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ error: "El comentario no puede estar vacío" });
    }

    const product = await prisma.ecommerceProduct.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const review = await prisma.ecommerceReview.create({
      data: {
        productId,
        userId: req.user.id,
        rating: numRating,
        comment: String(comment).trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    res.status(201).json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        name: `${review.user.firstName} ${review.user.lastName}`.trim(),
        role: review.user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
