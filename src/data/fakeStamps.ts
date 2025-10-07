import type { Stamp } from "../types/invoice.types";

let STAMPS: Stamp[] = [
  { id: "s1", name: "SAYJU", companyName: "Sayju S.A.", address: "C/ Ejemplo 123, Madrid", taxId: "B-12345678" },
  { id: "s2", name: "ACME", companyName: "ACME S.L.", address: "C/ Industria 12, Madrid", taxId: "B-11223344", imgUrl: "https://dummyimage.com/160x80/111/fff&text=ACME" },
  { id: "s3", name: "GLOBEX", companyName: "Globex S.L.", address: "Av. Diagonal 320, Barcelona", taxId: "B-99887766" },
];

export function getStamps(): Stamp[] {
  return STAMPS;
}

export function addStamp(input: Omit<Stamp, "id"> & Partial<Pick<Stamp, "id">>): Stamp {
  const id = input.id ?? `s${Date.now()}`;
  const stamp: Stamp = { id, name: input.name, companyName: input.companyName, address: input.address, taxId: input.taxId, imgUrl: input.imgUrl };
  STAMPS = [stamp, ...STAMPS];
  return stamp;
}

export function updateStamp(id: string, patch: Partial<Stamp>): Stamp | null {
  let out: Stamp | null = null;
  STAMPS = STAMPS.map((s) => {
    if (s.id === id) {
      out = { ...s, ...patch } as Stamp;
      return out;
    }
    return s;
  });
  return out;
}

export function removeStamp(id: string): void {
  STAMPS = STAMPS.filter((s) => s.id !== id);
}
