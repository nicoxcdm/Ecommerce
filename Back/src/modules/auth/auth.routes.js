const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Role } = require("@prisma/client");
const { prisma } = require("../../db/prisma");
const { hashPassword, verifyPassword } = require("../../utils/password");
const { signToken, signRefreshToken } = require("../../utils/jwt");
const { sendVerificationEmail } = require("../../utils/mailer");
const { requireAuth, isEcommerceAdmin } = require("../../middlewares/auth");

const router = express.Router();

function hashCode(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function toUserDto(user) {
  const nombre = user.firstName;
  const apellido = user.lastName;
  return {
    id: user.id,
    nombre,
    apellido,
    name: `${nombre} ${apellido}`.trim(),
    dni: user.dni,
    email: user.email,
    role: user.role,
    ecommerceRole: isEcommerceAdmin(user.role) ? "ADMIN" : "USER",
    isAdmin: isEcommerceAdmin(user.role),
    pais: user.country,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, apellido, dni, email, password, confirmPassword, pais } = req.body || {};

    if (!nombre || !apellido || !dni || !email || !password) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben completarse" });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existsEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existsEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const existsDni = await prisma.user.findUnique({ where: { dni: String(dni).trim() } });
    if (existsDni) {
      return res.status(400).json({ error: "El DNI ya está registrado" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await sendVerificationEmail(normalizedEmail, verificationCode);

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName: String(nombre).trim(),
        lastName: String(apellido).trim(),
        dni: String(dni).trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
        emailVerified: false,
        verificationCode: hashCode(verificationCode),
        country: pais || "Argentina",
      },
    });

    res.status(201).json({
      message: "Registro exitoso. Revisa tu correo para ingresar el código de verificación.",
      user: toUserDto(user),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res, next) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ error: "Email y código son obligatorios" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (!user.verificationCode) {
      return res.status(400).json({ error: "El código de verificación ya fue utilizado o no existe" });
    }

    const hashedInput = hashCode(String(code).trim());
    const jwtSecret = process.env.JWT_SECRET || "change-me-please";

    if (user.verificationCode !== hashedInput) {
      try {
        const decoded = jwt.verify(user.verificationCode, jwtSecret);
        if (decoded.codeHash !== hashedInput) {
          return res.status(400).json({ error: "Código de verificación inválido" });
        }
      } catch {
        return res.status(400).json({ error: "El código de verificación es inválido o ha expirado" });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationCode: null },
    });

    res.json({ ok: true, message: "Correo verificado correctamente" });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña obligatorios" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Debes verificar tu email antes de iniciar sesión",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    res.json({ token, refreshToken, user: toUserDto(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: toUserDto(req.user) });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "El correo electrónico es obligatorio" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ error: "No existe una cuenta con ese correo" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const jwtSecret = process.env.JWT_SECRET || "change-me-please";
    const wrappedToken = jwt.sign({ codeHash: hashCode(code) }, jwtSecret, { expiresIn: "15m" });

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: wrappedToken },
    });

    await sendVerificationEmail(normalizedEmail, code);

    res.json({ ok: true, message: "Se envió un código de recuperación de 6 dígitos a tu correo." });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, código y nueva contraseña son obligatorios" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.verificationCode) {
      return res.status(400).json({ error: "Código inválido o expirado" });
    }

    const hashedInput = hashCode(String(code).trim());
    const jwtSecret = process.env.JWT_SECRET || "change-me-please";

    if (user.verificationCode !== hashedInput) {
      try {
        const decoded = jwt.verify(user.verificationCode, jwtSecret);
        if (decoded.codeHash !== hashedInput) {
          return res.status(400).json({ error: "Código inválido" });
        }
      } catch {
        return res.status(400).json({ error: "El código es inválido o ha expirado (15 min)" });
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, verificationCode: null, emailVerified: true },
    });

    res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
