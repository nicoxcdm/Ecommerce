require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3002),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5174",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change-me-please",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret-please",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "365d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "365d",
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  mercadoPagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || "",
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || "http://localhost:3002",
};

module.exports = { env };
