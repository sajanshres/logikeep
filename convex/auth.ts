const SALT = "logikeep-salt";

export function hashPassword(password: string): string {
  const input = password + SALT;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `lk_${hash.toString(16)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored === password) return true;
  return stored === hashPassword(password);
}
