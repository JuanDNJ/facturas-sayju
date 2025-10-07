const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function isValidDNI(raw: string): boolean {
  if (!raw) return false;
  const v = raw.toUpperCase().replace(/[-\s]/g, "");
  // NIE: X/Y/Z + 7 dígitos + letra
  const nieMatch = v.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (nieMatch) {
    const prefix = nieMatch[1];
    const num = nieMatch[2];
    const letter = nieMatch[3];
    const mapped = (prefix === "X" ? "0" : prefix === "Y" ? "1" : "2") + num;
    const idx = parseInt(mapped, 10) % 23;
    return DNI_LETTERS[idx] === letter;
  }
  // DNI: 8 dígitos + letra
  const m = v.match(/^(\d{8})([A-Z])$/);
  if (!m) return false;
  const number = parseInt(m[1], 10);
  const letter = m[2];
  const idx = number % 23;
  return DNI_LETTERS[idx] === letter;
}

// Validación simple de email (RFC-like, suficiente para formularios)
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const v = String(email).trim();
  // Permite letras, dígitos y algunos símbolos comunes, dominio con puntos
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(v);
}
