/** UPI deep link shared with the Web app QR (`upi://pay`). Keep the parameter order stable. */

const isValidUpiId = (upiId) => /^[\w.]{2,}@[a-zA-Z]{2,}$/.test(String(upiId || "").trim());

const buildUpiPayUri = ({ upiId, payee, amount, note, transactionRef }) => {
  const id = String(upiId || "").trim();
  if (!isValidUpiId(id)) {
    const error = new Error("Enter a valid UPI ID.");
    error.code = "INVALID_UPI";
    throw error;
  }
  const value = Number(amount);
  if (!(value > 0) || !Number.isFinite(value)) {
    const error = new Error("Token amount must be greater than zero.");
    error.code = "INVALID_AMOUNT";
    throw error;
  }
  const pairs = [
    ["pa", id],
    ["pn", String(payee || "Builtglory")],
    ["am", value.toFixed(2)],
    ["cu", "INR"],
    ["tn", String(note || "Token")],
    ["tr", String(transactionRef || Date.now())]
  ];
  return `upi://pay?${pairs.map(([key, item]) => `${key}=${encodeURIComponent(item)}`).join("&")}`;
};

module.exports = { isValidUpiId, buildUpiPayUri };
