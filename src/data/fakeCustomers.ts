import type { Customer } from "../types/invoice.types";

export const FAKE_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "Acme Corp.",
    email: "billing@acme.com",
    address: "C/ Industria 12, Madrid",
    taxId: "B-11223344",
    phone: "+34 600 100 200",
  },
  {
    id: "2",
    name: "Globex S.L.",
    email: "facturacion@globex.es",
    address: "Av. Diagonal 320, Barcelona",
    taxId: "B-99887766",
    phone: "+34 600 200 300",
  },
  {
    id: "3",
    name: "Initech Ltd.",
    email: "finanzas@initech.co",
    address: "C/ Tecnología 5, Valencia",
    taxId: "B-55667788",
    phone: "+34 600 300 400",
  },
];
