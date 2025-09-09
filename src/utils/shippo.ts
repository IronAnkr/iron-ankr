export type ShippoAddress = {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string; // ISO 2-letter, e.g. "US"
  phone?: string;
  email?: string;
};

export type ShippoParcel = {
  length: number;
  width: number;
  height: number;
  distance_unit: "in" | "cm";
  weight: number;
  mass_unit: "oz" | "lb" | "g" | "kg";
};

export function getShippoConfig() {
  const token = process.env.SHIPPO_API_TOKEN;
  const baseUrl = process.env.SHIPPO_BASE_URL || "https://api.goshippo.com";
  if (!token) throw new Error("Missing SHIPPO_API_TOKEN env var");
  return { token, baseUrl };
}

export function getDefaultFromAddress(): ShippoAddress | null {
  const street1 = process.env.SHIP_FROM_STREET1;
  const city = process.env.SHIP_FROM_CITY;
  const state = process.env.SHIP_FROM_STATE;
  const zip = process.env.SHIP_FROM_ZIP;
  const country = process.env.SHIP_FROM_COUNTRY || "US";
  if (!street1 || !city || !state || !zip) return null;
  return {
    name: process.env.SHIP_FROM_NAME,
    company: process.env.SHIP_FROM_COMPANY,
    street1,
    street2: process.env.SHIP_FROM_STREET2 || undefined,
    city,
    state,
    zip,
    country,
    phone: process.env.SHIP_FROM_PHONE,
    email: process.env.SHIP_FROM_EMAIL,
  };
}

