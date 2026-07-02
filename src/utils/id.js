const crypto = require("crypto");

/**
 * Kisa, okunabilir benzersiz id uretir. Ornek: "chd_3f9a2b1c"
 * @param {string} prefix
 */
function genId(prefix) {
  const rand = crypto.randomBytes(5).toString("hex");
  return prefix ? `${prefix}_${rand}` : rand;
}

module.exports = { genId };
