type WorkerEncryptedRecord = {
  id: string;
  data: string;
  cacheKey: string;
};

type WorkerDecryptedRecord = {
  cacheKey: string;
  value: {
    id: string;
    site: string;
    user: string;
    pass: string;
    comments: string;
    timestamp: string;
    sync: string;
    is_deleted: string;
  };
};

type WorkerRequest = {
  records: WorkerEncryptedRecord[];
  password: string;
};

type WorkerResponse =
  | { ok: true; records: WorkerDecryptedRecord[] }
  | { ok: false; error: string };

let cachedPassword = "";
let cachedPasswordKey: CryptoKey | null = null;

function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ToStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

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
    ["decrypt"],
  );
}

async function decrypt(
  encryptedBase64: string,
  password: string,
): Promise<string | null> {
  try {
    const encryptedBytes = new Uint8Array(base64ToArrayBuffer(encryptedBase64));
    const salt = encryptedBytes.slice(0, 16);
    const iv = encryptedBytes.slice(16, 28);
    const data = encryptedBytes.slice(28);

    const key = await deriveKey(password, salt, 200000);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(data),
    );

    return uint8ToStr(new Uint8Array(decrypted));
  } catch {
    return null;
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { records, password } = event.data;

  try {
    const result: WorkerDecryptedRecord[] = [];

    for (const record of records) {
      const decryptedText = await decrypt(record.data, password);
      if (!decryptedText) {
        throw new Error("Failed to decrypt one or more records.");
      }
      const info = JSON.parse(decryptedText) as {
        site: string;
        user: string;
        pass: string;
        comments: string;
        timestamp: string;
        sync: string;
        is_deleted: string;
      };

      result.push({
        cacheKey: record.cacheKey,
        value: {
          id: record.id,
          site: info.site,
          user: info.user,
          pass: info.pass,
          comments: info.comments,
          timestamp: info.timestamp,
          sync: info.sync,
          is_deleted: info.is_deleted,
        },
      });
    }

    const response: WorkerResponse = { ok: true, records: result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : "Worker decrypt failed.",
    };
    self.postMessage(response);
  }
};

export {};
