// --- Helper functions ---
function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function uint8ToStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

let cachedPassword = "";
let cachedPasswordKey: CryptoKey | null = null;

async function getPasswordKey(password: string): Promise<CryptoKey> {
  if (cachedPasswordKey && cachedPassword === password) {
    return cachedPasswordKey;
  }

  const imported = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(strToUint8(password)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  cachedPassword = password;
  cachedPasswordKey = imported;
  return imported;
}

// --- Key Derivation ---
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 200000,
): Promise<CryptoKey> {
  const passwordKey = await getPasswordKey(password);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: iterations,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

// --- Encryption ---
export async function encrypt(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toArrayBuffer(strToUint8(text)),
  );

  const combined = new Uint8Array([
    ...salt,
    ...iv,
    ...new Uint8Array(encrypted),
  ]);

  return arrayBufferToBase64(combined.buffer);
}

// --- Decryption ---
export async function decrypt(
  encryptedBase64: string,
  password: string,
): Promise<string | null> {
  const encryptedBytes = new Uint8Array(base64ToArrayBuffer(encryptedBase64));
  const salt = encryptedBytes.slice(0, 16);
  const iv = encryptedBytes.slice(16, 28);
  const data = encryptedBytes.slice(28);

  const tryDecryptWithIterations = async (iterations: number) => {
    const key = await deriveKey(password, salt, iterations);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(data),
    );
    return uint8ToStr(new Uint8Array(decrypted));
  };

  try {
    return await tryDecryptWithIterations(200000);
  } catch {
    try {
      return await tryDecryptWithIterations(600000);
    } catch {
      return null;
    }
  }
}

export async function canDecrypt(
  encryptedBase64: string,
  password: string,
): Promise<boolean> {
  const result = await decrypt(encryptedBase64, password);
  return result !== null;
}

// --- SHA-256 Hash ---
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

//ONLY for development/debugging
// if (typeof window !== "undefined") {
//   (window as any).Crypto = { encrypt, decrypt, sha256 , canDecrypt};
// }
