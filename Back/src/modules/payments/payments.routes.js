const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { prisma } = require("../../db/prisma");
const { env } = require("../../config/env");
const { optionalAuth } = require("../../middlewares/auth");

const router = express.Router();

// POST /api/payments/checkout
router.post("/checkout", optionalAuth, async (req, res, next) => {
  try {
    const { items, buyerEmail } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    const productIds = items.map((i) => Number(i.productId)).filter((id) => !Number.isNaN(id));
    const dbProducts = await prisma.ecommerceProduct.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const orderItemsData = [];
    let total = 0;

    for (const item of items) {
      const prod = productMap.get(Number(item.productId));
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!prod) {
        return res.status(400).json({ error: `Producto ${item.productId} no disponible` });
      }
      total += prod.price * qty;
      orderItemsData.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.price,
      });
    }

    const order = await prisma.ecommerceOrder.create({
      data: {
        userId: req.user ? req.user.id : null,
        buyerEmail: req.user ? req.user.email : buyerEmail || null,
        total,
        currency: "ARS",
        status: "PENDING",
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    if (!env.mercadoPagoAccessToken) {
      return res.status(500).json({ error: "Mercado Pago no está configurado en el servidor" });
    }

    const client = new MercadoPagoConfig({ accessToken: env.mercadoPagoAccessToken });
    const preference = new Preference(client);

    const mpItems = order.items.map((item) => ({
      id: String(item.productId),
      title: item.productName,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: "ARS",
    }));

    const prefBody = {
      items: mpItems,
      external_reference: `ecommerce_order_${order.id}`,
      back_urls: {
        success: `${env.frontendOrigin}/?payment=success&orderId=${order.id}`,
        failure: `${env.frontendOrigin}/?payment=failure&orderId=${order.id}`,
        pending: `${env.frontendOrigin}/?payment=pending&orderId=${order.id}`,
      },
      notification_url: `${env.backendPublicUrl}/api/payments/webhook`,
    };

    if (order.buyerEmail) {
      prefBody.payer = { email: order.buyerEmail };
    }

    const mpResponse = await preference.create({ body: prefBody });

    await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: { mpPreferenceId: mpResponse.id || null },
    });

    res.json({
      orderId: order.id,
      preferenceId: mpResponse.id,
      initPoint: mpResponse.init_point,
      sandboxInitPoint: mpResponse.sandbox_init_point,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook
router.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.["data.id"];
    const type = req.body?.type || req.query?.type;

    if (type === "payment" && paymentId && env.mercadoPagoAccessToken) {
      const client = new MercadoPagoConfig({ accessToken: env.mercadoPagoAccessToken });
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const extRef = payment?.external_reference || "";
      if (extRef.startsWith("ecommerce_order_")) {
        const orderId = Number(extRef.replace("ecommerce_order_", ""));
        if (!Number.isNaN(orderId)) {
          const newStatus =
            payment.status === "approved"
              ? "PAID"
              : payment.status === "rejected" || payment.status === "cancelled"
              ? "CANCELLED"
              : "PENDING";

          await prisma.ecommerceOrder.update({
            where: { id: orderId },
            data: {
              status: newStatus,
              mpPaymentId: String(paymentId),
            },
          });
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("[MP WEBHOOK ERROR]", err.message);
    res.sendStatus(200);
  }
});

module.exports = router;
