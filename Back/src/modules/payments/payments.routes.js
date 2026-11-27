const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { prisma } = require("../../db/prisma");
const { env } = require("../../config/env");
const { optionalAuth } = require("../../middlewares/auth");

const router = express.Router();

// ============================================================
// PAYWAY (Decidir / Prisma Medios de Pago - Acreditación BBVA)
// ============================================================

// GET /api/payments/payway/config
router.get("/payway/config", (_req, res) => {
  const configured = Boolean(env.paywayPublicKey && env.paywayPrivateKey);
  res.json({
    configured,
    env: env.paywayEnv,
    publicKey: env.paywayPublicKey || null,
    siteId: env.paywaySiteId || null,
  });
});

// POST /api/payments/payway/checkout
router.post("/payway/checkout", optionalAuth, async (req, res, next) => {
  try {
    const { items, buyerEmail, token, paymentMethodId, bin, installments = 1 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    if (!env.paywayPrivateKey || !env.paywayPublicKey) {
      return res.status(503).json({
        error: "Payway todavía no tiene cargadas las credenciales (PAYWAY_PUBLIC_KEY / PAYWAY_PRIVATE_KEY) en el servidor.",
      });
    }

    if (!token || !paymentMethodId || !bin) {
      return res.status(400).json({
        error: "Faltan datos de tokenización de tarjeta de Payway (token, paymentMethodId, bin)",
      });
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
        paymentProvider: "PAYWAY",
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    const buyerFirstName = req.user?.firstName || "Cliente";
    const buyerLastName = req.user?.lastName || "MZ";
    const buyerEmailSafe = order.buyerEmail || "cliente@marcelazelaya.com";
    const buyerIp =
      (req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : null) ||
      req.socket?.remoteAddress ||
      "190.0.0.1";
    const cleanIp = buyerIp.replace(/^::ffff:/, "");
    const amountCents = Math.round(total * 100);

    const paywayPayload = {
      site_transaction_id: `MZ_ORDER_${order.id}_${Date.now()}`,
      token: String(token),
      user_id: req.user ? String(req.user.id) : `guest_${order.id}`,
      payment_method_id: Number(paymentMethodId),
      bin: String(bin).slice(0, 6),
      amount: amountCents, // Payway espera el monto en centavos
      currency: "ARS",
      installments: Number(installments) || 1,
      description: `Compra E-Commerce MZ #${order.id}`,
      payment_type: "single",
      sub_payments: [],
      fraud_detection: {
        send_to_cs: true,
        channel: "Web",
        device_unique_id: `mz_${order.id}_${Date.now()}`,
        bill_to: {
          city: "Buenos Aires",
          country: "AR",
          customer_id: req.user ? String(req.user.id) : `guest_${order.id}`,
          email: buyerEmailSafe,
          first_name: buyerFirstName,
          last_name: buyerLastName,
          phone_number: "1100000000",
          postal_code: "1425",
          state: "C",
          street1: "Av. Santa Fe 1000",
        },
        purchase_totals: {
          currency: "ARS",
          amount: amountCents,
        },
        customer_in_site: {
          days_in_site: 1,
          is_guest: !req.user,
          password: "N/A",
          num_of_transactions: 1,
          cellphone_number: "1100000000",
          date_of_birth: "1990-01-01",
          street: "Av. Santa Fe 1000",
        },
        retail_transaction_data: {
          ship_to: {
            city: "Buenos Aires",
            country: "AR",
            customer_id: req.user ? String(req.user.id) : `guest_${order.id}`,
            email: buyerEmailSafe,
            first_name: buyerFirstName,
            last_name: buyerLastName,
            phone_number: "1100000000",
            postal_code: "1425",
            state: "C",
            street1: "Av. Santa Fe 1000",
          },
          dispatch_method: "storepickup",
          days_to_delivery: "1",
          items: order.items.map((item) => ({
            code: String(item.productId),
            description: item.productName.slice(0, 100),
            name: item.productName.slice(0, 60),
            sku: `MZ-${item.productId}`,
            total_amount: Math.round(item.unitPrice * item.quantity * 100),
            quantity: item.quantity,
            unit_price: Math.round(item.unitPrice * 100),
          })),
        },
        ip_address: cleanIp,
      },
    };

    const pwRes = await fetch(`${env.paywayBaseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.paywayPrivateKey,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(paywayPayload),
    });

    const pwData = await pwRes.json().catch(() => ({}));

    if (!pwRes.ok) {
      console.error("[PAYWAY ERROR]", pwRes.status, JSON.stringify(pwData));
      await prisma.ecommerceOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      const validationMsg = Array.isArray(pwData?.validation_errors)
        ? pwData.validation_errors.map((e) => `${e.code || ""}: ${e.param || ""}`).join(", ")
        : "";
      const reasonMsg =
        pwData?.status_details?.error?.reason?.description ||
        pwData?.message ||
        validationMsg ||
        pwData?.error_type ||
        "Payway rechazó la operación";
      return res.status(400).json({
        error: `Payway (${pwRes.status}): ${reasonMsg}`,
        details: pwData,
      });
    }

    const isApproved = pwData.status === "approved";
    const newStatus = isApproved ? "PAID" : pwData.status === "rejected" ? "CANCELLED" : "PENDING";

    await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        paywayPaymentId: pwData.id ? String(pwData.id) : null,
      },
    });

    // Descontar stock automáticamente si el pago fue aprobado
    if (isApproved) {
      for (const item of order.items) {
        await prisma.ecommerceProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    res.json({
      ok: isApproved,
      orderId: order.id,
      status: newStatus,
      paywayPaymentId: pwData.id || null,
      paywayStatus: pwData.status,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// MERCADO PAGO (Opcional / Respaldo)
// ============================================================

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
      payment_methods: {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" },
          { id: "atm" },
        ],
      },
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
