export interface User {
  address: string;
  companyName?: string;
  createAt?: string;
  displayName: string;
  zipcode?: string;
  email: string;
  nifDni: string;
  updateAt?: string;
  // Marcador de migración de sellos desde datos locales a Firestore
  stampsImported?: boolean;
}