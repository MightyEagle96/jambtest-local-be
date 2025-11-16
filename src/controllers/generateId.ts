import crypto from "crypto";

export const generateId = () => {
  const h = crypto.randomBytes(16).toString("hex");

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16)}`;
};
