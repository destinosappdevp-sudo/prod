// Lista completa de bancos venezolanos con códigos
export const BANKS = [
  { code: "0102", name: "BANCO DE VENEZUELA", value: "banco_venezuela" },
  { code: "0156", name: "100% BANCO", value: "100_banco" },
  { code: "0172", name: "BANCAMIGA BANCO UNIVERSAL, C.A.", value: "bancamiga" },
  { code: "0114", name: "BANCARIBE", value: "bancaribe" },
  { code: "0171", name: "BANCO ACTIVO", value: "banco_activo" },
  { code: "0134", name: "BANESCO", value: "banesco" },
  { code: "0163", name: "BANCO DEL TESORO", value: "banco_tesoro" },
  { code: "0175", name: "BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL", value: "banco_digital_trabajadores" },
  { code: "0115", name: "BANCO EXTERIOR", value: "banco_exterior" },
  { code: "0151", name: "BANCO FONDO COMÚN", value: "banco_fondo_comun" },
  { code: "0105", name: "BANCO MERCANTIL", value: "banco_mercantil" },
  { code: "0191", name: "BANCO NACIONAL DE CREDITO", value: "banco_nacional_credito" },
  { code: "0138", name: "BANCO PLAZA", value: "banco_plaza" },
  { code: "0137", name: "BANCO SOFITASA", value: "banco_sofitasa" },
  { code: "0104", name: "BANCO VENEZOLANO DE CREDITO", value: "banco_venezolano_credito" },
  { code: "0168", name: "BANCRECER", value: "bancrecer" },
  { code: "0177", name: "BANFANB", value: "banfanb" },
  { code: "0146", name: "BANGENTE", value: "bangente" },
  { code: "0174", name: "BANPLUS", value: "banplus" },
  { code: "0108", name: "BBVA PROVINCIAL", value: "bbva_provincial" },
  { code: "0157", name: "DELSUR BANCO UNIVERSAL", value: "delsur" },
  { code: "0601", name: "INSTITUTO MUNICIPAL DE CREDITO POPULAR", value: "imcp" },
  { code: "0178", name: "N58 BANCO DIGITAL BANCO MICROFINANCIERO SA", value: "n58" },
  { code: "0169", name: "R4 BANCO MICROFINANCIERO C.A.", value: "r4" },
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



