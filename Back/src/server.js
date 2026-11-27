const { app } = require("./app");
const { env } = require("./config/env");

app.listen(env.port, () => {
  console.log(`[E-Commerce MZ Back] Servidor corriendo en http://localhost:${env.port}`);
});
