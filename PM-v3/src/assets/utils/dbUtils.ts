const STORAGE_KEY = "PM";

// Save array to localStorage
export function save(data: Record<string, any>[]): void {
  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

// Load array from localStorage
export function load(): Record<string, any>[] {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    if (!jsonString) return [];
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return [];
  }
}

// Add a new record
export function add(record: Record<string, any>): void {
  const current = load();
  current.push(record);
  save(current);
}

// Update a record at a specific index
export function update(index: number, newRecord: Record<string, any>): void {
  const current = load();
  if (index >= 0 && index < current.length) {
    current[index] = newRecord;
    save(current);
  } else {
    console.warn("Index out of bounds in update:", index);
  }
}

// Remove a record at a specific index
export function remove(index: number): void {
  const current = load();
  if (index >= 0 && index < current.length) {
    current.splice(index, 1);
    save(current);
  } else {
    console.warn("Index out of bounds in remove:", index);
  }
}
