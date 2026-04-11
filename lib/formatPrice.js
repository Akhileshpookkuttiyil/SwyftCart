export const formatPrice = (value, currency = "₹") => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `${currency}0.00`;
  }

  return `${currency}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
