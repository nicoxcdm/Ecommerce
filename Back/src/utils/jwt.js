const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, tokenType: "refresh" },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  signToken,
  verifyToken,
  signRefreshToken,
  verifyRefreshToken,
};
