export function formatNGN(amount: number | string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(Number(amount));
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export const VAT_RATE = 0.075;

export function calcVAT(subtotal: number) {
  return subtotal * VAT_RATE;
}

export function calcDelivery(subtotal: number) {
  return subtotal >= 25000 ? 0 : 1500;
}

export function calcTotal(subtotal: number, discount = 0) {
  const taxable = subtotal - discount;
  const vat = calcVAT(taxable);
  const delivery = calcDelivery(subtotal);
  return { taxable, vat, delivery, total: taxable + vat + delivery };
}
