function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.expose ? err.message : "Error interno del servidor";
  if (status >= 500) {
    console.error("[ERROR]", err);
  }
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
