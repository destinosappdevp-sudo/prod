// Lista completa de bancos venezolanos con códigos
export const BANKS = [
  { code: "0102", name: "Banco de Venezuela", value: "banco_venezuela" },
  { code: "0104", name: "Mercantil", value: "mercantil" },
  { code: "0105", name: "Banco Agrícola", value: "banco_agricola" },
  { code: "0108", name: "Provincial", value: "provincial" },
  { code: "0110", name: "BOD (Banco Occidental de Descuento)", value: "bod" },
  { code: "0114", name: "Bancaribe", value: "bancaribe" },
  { code: "0116", name: "Banco del Caribe", value: "banco_caribe" },
  { code: "0128", name: "Banesco", value: "banesco" },
  { code: "0131", name: "Banco Itaú", value: "banco_itau" },
  { code: "0134", name: "Banesco (0134)", value: "banesco_134" },
  { code: "0135", name: "Banco Bicentenario", value: "bicentenario" },
  { code: "0137", name: "Banco del Tesoro", value: "banco_tesoro" },
  { code: "0138", name: "Banco Autofin", value: "banco_autofin" },
  { code: "0139", name: "Banco Activo", value: "banco_activo" },
  { code: "0140", name: "Banco Metropolis", value: "banco_metropolis" },
  { code: "0141", name: "Banplus", value: "banplus" },
  { code: "0143", name: "Banco Lido", value: "banco_lido" },
  { code: "0144", name: "Banco Fintéch", value: "banco_fintech" },
];

export const PAYMENT_METHODS = {
  PAGO_MOVIL: "PAGO_MOVIL",
  TRANSFERENCIA_BANCARIA: "TRANSFERENCIA_BANCARIA",
  ZELLE: "ZELLE",
  ZILLI: "ZILLI",
  TARJETA_INTERNACIONAL: "TARJETA_INTERNACIONAL",
};

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const getBankByValue = (value: string) => {
  return BANKS.find((bank) => bank.value === value);
};

export const getBankCode = (value: string) => {
  return BANKS.find((bank) => bank.value === value)?.code || "";
};
