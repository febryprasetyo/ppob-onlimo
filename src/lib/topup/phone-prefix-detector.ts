export type PhoneProvider =
  | "TELKOMSEL"
  | "INDOSAT"
  | "XL"
  | "AXIS"
  | "TRI"
  | "SMARTFREN"
  | "BYU"
  | "UNKNOWN";

export interface ProviderInfo {
  provider: PhoneProvider;
  name: string;
  color: string;
}

const PREFIX_MAP: Record<string, PhoneProvider> = {
  // Telkomsel / Halo / SimPATI / Kartu AS / Loop
  "0811": "TELKOMSEL",
  "0812": "TELKOMSEL",
  "0813": "TELKOMSEL",
  "0821": "TELKOMSEL",
  "0822": "TELKOMSEL",
  "0823": "TELKOMSEL",
  "0852": "TELKOMSEL",
  "0853": "TELKOMSEL",
  "62811": "TELKOMSEL",
  "62812": "TELKOMSEL",
  "62813": "TELKOMSEL",
  "62821": "TELKOMSEL",
  "62822": "TELKOMSEL",
  "62823": "TELKOMSEL",
  "62852": "TELKOMSEL",
  "62853": "TELKOMSEL",

  // by.U (Sub-brand of Telkomsel prefix 0851)
  "0851": "BYU",
  "62851": "BYU",

  // Indosat Ooredoo (IM3, Mentari, Matrix)
  "0814": "INDOSAT",
  "0815": "INDOSAT",
  "0816": "INDOSAT",
  "0855": "INDOSAT",
  "0856": "INDOSAT",
  "0857": "INDOSAT",
  "0858": "INDOSAT",
  "62814": "INDOSAT",
  "62815": "INDOSAT",
  "62816": "INDOSAT",
  "62855": "INDOSAT",
  "62856": "INDOSAT",
  "62857": "INDOSAT",
  "62858": "INDOSAT",

  // XL Axiata
  "0817": "XL",
  "0818": "XL",
  "0819": "XL",
  "0859": "XL",
  "0877": "XL",
  "0878": "XL",
  "62817": "XL",
  "62818": "XL",
  "62819": "XL",
  "62859": "XL",
  "62877": "XL",
  "62878": "XL",

  // AXIS
  "0831": "AXIS",
  "0832": "AXIS",
  "0833": "AXIS",
  "0838": "AXIS",
  "62831": "AXIS",
  "62832": "AXIS",
  "62833": "AXIS",
  "62838": "AXIS",

  // Tri (3)
  "0895": "TRI",
  "0896": "TRI",
  "0897": "TRI",
  "0898": "TRI",
  "0899": "TRI",
  "62895": "TRI",
  "62896": "TRI",
  "62897": "TRI",
  "62898": "TRI",
  "62899": "TRI",

  // Smartfren
  "0881": "SMARTFREN",
  "0882": "SMARTFREN",
  "0883": "SMARTFREN",
  "0884": "SMARTFREN",
  "0885": "SMARTFREN",
  "0886": "SMARTFREN",
  "0887": "SMARTFREN",
  "0888": "SMARTFREN",
  "0889": "SMARTFREN",
  "62881": "SMARTFREN",
  "62882": "SMARTFREN",
  "62883": "SMARTFREN",
  "62884": "SMARTFREN",
  "62885": "SMARTFREN",
  "62886": "SMARTFREN",
  "62887": "SMARTFREN",
  "62888": "SMARTFREN",
  "62889": "SMARTFREN",
};

export const PROVIDER_DETAILS: Record<PhoneProvider, ProviderInfo> = {
  TELKOMSEL: { provider: "TELKOMSEL", name: "Telkomsel", color: "bg-red-600 text-white" },
  BYU: { provider: "BYU", name: "by.U", color: "bg-emerald-600 text-white" },
  INDOSAT: { provider: "INDOSAT", name: "Indosat", color: "bg-amber-500 text-slate-950" },
  XL: { provider: "XL", name: "XL", color: "bg-blue-600 text-white" },
  AXIS: { provider: "AXIS", name: "Axis", color: "bg-purple-600 text-white" },
  TRI: { provider: "TRI", name: "Tri (3)", color: "bg-rose-600 text-white" },
  SMARTFREN: { provider: "SMARTFREN", name: "Smartfren", color: "bg-pink-600 text-white" },
  UNKNOWN: { provider: "UNKNOWN", name: "Semua Provider", color: "bg-slate-700 text-slate-200" },
};

export function detectPhoneProvider(phoneNumber: string): ProviderInfo {
  if (!phoneNumber) return PROVIDER_DETAILS.UNKNOWN;

  // Clean non-numeric characters
  let clean = phoneNumber.replace(/\D/g, "");
  if (clean.startsWith("62")) {
    // Check 5-digit prefix (e.g. 62812)
    const p5 = clean.slice(0, 5);
    if (PREFIX_MAP[p5]) return PROVIDER_DETAILS[PREFIX_MAP[p5]];
    // Or convert to 08xx
    clean = "0" + clean.slice(2);
  }

  if (clean.length >= 4) {
    const p4 = clean.slice(0, 4);
    if (PREFIX_MAP[p4]) {
      return PROVIDER_DETAILS[PREFIX_MAP[p4]];
    }
  }

  return PROVIDER_DETAILS.UNKNOWN;
}
