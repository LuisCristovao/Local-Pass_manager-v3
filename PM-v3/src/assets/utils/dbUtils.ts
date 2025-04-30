import { openDB, deleteDB } from "idb";
import * as Crypto from "./cryptoUtils";

const DB_NAME = "PM_DB";
const STORE_NAME = "records";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  },
});

// Add a new record (auto-generates UUID if none is provided)
export async function add(
  record: Record<string, any>,
  password: string = ""
): Promise<string> {
  const db = await dbPromise;

  if (!record.id) {
    record.id = crypto.randomUUID();
  }
  if (password !== "") {
    const encrypted_data = await Crypto.encrypt(
      JSON.stringify(record),
      password
    );

    await db.add(STORE_NAME, {
      id: record.id, // ✅ Key path
      data: encrypted_data, // ✅ Encrypted data
    });
  }else{// already encrypted
    await db.add(STORE_NAME,record)
  }

  return record.id;
}

// Load all records
export async function load(): Promise<Record<string, any>[]> {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

// Update a record by ID (throws error if ID not found)
export async function update(
  id: string,
  newData: Record<string, any>,
  password: string
): Promise<void> {
  const db = await dbPromise;

  const existing = await db.get(STORE_NAME, id);
  if (!existing) {
    throw new Error(`Update failed: No record found with ID "${id}".`);
  }
  const encrypted_data = await Crypto.encrypt(
    JSON.stringify(newData),
    password
  );

  await db.put(STORE_NAME, {
    id: id,
    data: encrypted_data,
  });
}

// Remove a record by ID (throws error if ID not found)
export async function remove(id: string): Promise<void> {
  const db = await dbPromise;

  const existing = await db.get(STORE_NAME, id);
  if (!existing) {
    throw new Error(`Remove failed: No record found with ID "${id}".`);
  }

  await db.delete(STORE_NAME, id);
}

// Delete the entire database
export async function deleteDatabase(): Promise<void> {
  await (await dbPromise).close(); // close any open connections first
  await deleteDB(DB_NAME);
}

// Clear all records in the database without deleting the DB itself
export async function clearDatabase(): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.clear();
  await tx.done;
}

// Check if the database exists
export async function databaseExists(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    let existed = true;

    request.onupgradeneeded = () => {
      // This event only fires if DB didn't exist before
      existed = false;
    };

    request.onsuccess = () => {
      request.result.close();
      resolve(existed);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
}

// ONLY for development/debugging
// if (typeof window !== "undefined") {
//   (window as any).DB = { add, load, update, remove };
// }
