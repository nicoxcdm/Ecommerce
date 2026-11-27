const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(email, code) {
  const subject = "Verificación de correo - E-Commerce Marcela Zelaya";
  const text = `Tu código de verificación es: ${code}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb;">¡Te damos la bienvenida a la Tienda MZ!</h2>
      <p>Gracias por registrarte en el E-Commerce de Marcela Zelaya. Tu cuenta también es válida para la Plataforma.</p>
      <p>Tu código de verificación de 6 dígitos es:</p>
      <div style="background-color: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; letter-spacing: 4px; display: inline-block; min-width: 150px; margin: 10px 0; color: #1f2937;">
        ${code}
      </div>
      <p>Introduce este código en la pantalla de verificación para activar tu cuenta.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Si no has solicitado este registro, puedes ignorar este correo.</p>
    </div>
  `;

  if (process.env.GMAIL_SCRIPT_URL) {
    try {
      await fetch(process.env.GMAIL_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject,
          text,
          html,
          name: "Escuela MZ",
        }),
      });
      return;
    } catch (err) {
      console.error("Error al enviar correo vía GMAIL_SCRIPT_URL:", err.message);
    }
  }

  if (!transporter) {
    console.warn("[MAILER] SMTP no configurado. El correo de verificación no pudo enviarse.");
    return;
  }

  const from = process.env.SMTP_FROM || `"Escuela MZ" <${process.env.SMTP_USER}>`;
  try {
    await transporter.sendMail({ from, to: email, subject, text, html });
  } catch (err) {
    console.error("Error al enviar correo SMTP:", err.message);
  }
}

module.exports = { sendVerificationEmail };
