const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { env } = require("./config/env");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const categoriesRoutes = require("./modules/categories/categories.routes");
const laboratoriesRoutes = require("./modules/laboratories/laboratories.routes");
const productsRoutes = require("./modules/products/products.routes");
const paymentsRoutes = require("./modules/payments/payments.routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.frontendOrigin, "http://localhost:5173", "http://localhost:5174", "https://localhost:5173"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ecommerce-mz-back" });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/laboratories", laboratoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/payments", paymentsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

module.exports = { app };
