const ITERATIONS = 210000;

export async function hashPassword(password: string, salt = randomSalt()) {
  const derived = await derive(password, salt, ITERATIONS);
  return { passwordHash: derived, passwordSalt: salt, iterations: ITERATIONS };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
) {
  const actual = await derive(password, salt, iterations);
  return timingSafeEqual(actual, expectedHash);
}

export function validatePassword(password: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "Password is too long.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Include an uppercase letter, lowercase letter, and number.";
  }
  return null;
}

async function derive(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: new TextEncoder().encode(salt),
    iterations,
  }, key, 256);
  return toBase64Url(new Uint8Array(bits));
}

function randomSalt() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
