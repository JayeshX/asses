import { openDB } from 'idb';

export async function initDB() {
  return await openDB('CustomerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('email', 'email', { unique: false });
        store.createIndex('phone', 'phone', { unique: false });
      }
    }
  });
}

// Async generator for progress reporting
export async function* bulkInsertWithProgress(db, customers) {
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const tx = db.transaction('customers', 'readwrite');
    
    await Promise.all(batch.map(c => tx.store.add(c)));
    await tx.done;
    
    inserted += batch.length;
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    yield {
      inserted,
      total: customers.length,
      percent: (inserted / customers.length) * 100
    };
  }
}

// Regular version without progress
export async function bulkInsert(db, customers) {
  const batchSize = 1000;
  
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const tx = db.transaction('customers', 'readwrite');
    await Promise.all(batch.map(c => tx.store.add(c)));
    await tx.done;
  }
}

export async function getAllCustomers(db) {
  return await db.getAll('customers');
}

export async function getCustomerCount(db) {
  return await db.count('customers');
}
