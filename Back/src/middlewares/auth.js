const { verifyToken } = require("../utils/jwt");
const { prisma } = require("../db/prisma");

function isEcommerceAdmin(role) {
  return role === "ADMIN" || role === "DIRECTORA";
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        email: true,
        role: true,
        country: true,
        emailVerified: true,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: Number(payload.sub) },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dni: true,
          email: true,
          role: true,
          country: true,
          emailVerified: true,
        },
      });
      if (user) req.user = user;
    }
  } catch {
    // ignore invalid optional token
  }
  next();
}

function requireEcommerceAdmin(req, res, next) {
  if (!req.user || !isEcommerceAdmin(req.user.role)) {
    return res.status(403).json({ error: "Requiere permisos de administrador" });
  }
  next();
}

module.exports = {
  isEcommerceAdmin,
  requireAuth,
  optionalAuth,
  requireEcommerceAdmin,
};
