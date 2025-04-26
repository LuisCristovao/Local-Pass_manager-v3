import { openDB, deleteDB } from "idb";

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
export async function add(record: Record<string, any>): Promise<string> {
  const db = await dbPromise;

  if (!record.id) {
    record.id = crypto.randomUUID();
  }

  await db.add(STORE_NAME, record);
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
  newData: Record<string, any>
): Promise<void> {
  const db = await dbPromise;

  const existing = await db.get(STORE_NAME, id);
  if (!existing) {
    throw new Error(`Update failed: No record found with ID "${id}".`);
  }

  const updatedRecord = {
    ...existing,
    ...newData,
    id, // keep the original ID intact
  };

  await db.put(STORE_NAME, updatedRecord);
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



// ONLY for development/debugging
// if (typeof window !== "undefined") {
//   (window as any).DB = { add, load, update, remove };
// }
