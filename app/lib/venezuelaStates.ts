export const venezuelaStates = [
  { value: "CC", label: "Distrito Capital", latLng: [10.5, -66.9] },
  { value: "AM", label: "Amazonas", latLng: [2.7, -67.0] },
  { value: "AN", label: "Anzoátegui", latLng: [10.2, -64.5] },
  { value: "AP", label: "Apure", latLng: [7.0, -67.5] },
  { value: "AR", label: "Aragua", latLng: [10.3, -67.6] },
  { value: "BA", label: "Barinas", latLng: [8.8, -70.2] },
  { value: "BO", label: "Bolívar", latLng: [8.5, -62.5] },
  { value: "CA", label: "Carabobo", latLng: [10.3, -68.0] },
  { value: "CO", label: "Cojedes", latLng: [9.6, -66.8] },
  { value: "DA", label: "Delta Amacuro", latLng: [9.0, -62.0] },
  { value: "DF", label: "Dependencias Federales", latLng: [11.95, -66.85] },
  { value: "FA", label: "Falcón", latLng: [11.2, -69.5] },
  { value: "GU", label: "Guárico", latLng: [9.5, -65.5] },
  { value: "LA", label: "Lara", latLng: [10.0, -69.3] },
  { value: "ME", label: "Mérida", latLng: [8.8, -71.3] },
  { value: "MI", label: "Miranda", latLng: [10.5, -66.5] },
  { value: "MO", label: "Monagas", latLng: [10.2, -63.2] },
  { value: "NE", label: "Nueva Esparta", latLng: [11.0, -63.8] },
  { value: "PO", label: "Portuguesa", latLng: [9.3, -69.8] },
  { value: "SU", label: "Sucre", latLng: [10.6, -62.2] },
  { value: "TA", label: "Táchira", latLng: [7.8, -72.2] },
  { value: "TR", label: "Trujillo", latLng: [9.3, -70.4] },
  { value: "VA", label: "Vargas", latLng: [10.6, -66.2] },
  { value: "YA", label: "Yaracuy", latLng: [10.7, -68.7] },
  { value: "ZU", label: "Zulia", latLng: [10.2, -71.6] },
];

// Utility functions for server-side use
export const getStateByValue = (value: string) => {
  return venezuelaStates.find((item) => item.value === value);
};

export const getAllStates = () => venezuelaStates;

// Hook for client-side use
export const useVenezuelaStates = () => {
  return {
    getAllStates,
    getStateByValue,
  };
};
