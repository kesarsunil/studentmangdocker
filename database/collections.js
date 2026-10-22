import { getDB } from './db.js';

export async function initCollections() {
  try {
    const db = getDB();
    const cols = await db.listCollections().toArray();
    const colNames = cols.map(c => c.name);

    console.log(`📊 Active Collections in "${db.databaseName}":`, colNames.join(', '));

    // Ensure unique email indexes
    try {
      await db.collection('faculty').createIndex({ email: 1 }, { unique: true });
      await db.collection('students').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch {
      // Index might already exist
    }

    return colNames;
  } catch (err) {
    console.error('Error initializing MongoDB collections:', err.message);
    throw err;
  }
}
