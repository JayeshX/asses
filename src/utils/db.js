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

// Bulk insert with progress reporting dont know if working
export async function* bulkInsertWithProgress(db, customers) {
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const tx = db.transaction('customers', 'readwrite');
    
    await Promise.all(batch.map(c => tx.store.add(c)));
    await tx.done;
    
    inserted += batch.length;
    await new Promise(resolve => setTimeout(resolve, 0));
    
    yield {
      inserted,
      total: customers.length,
      percent: (inserted / customers.length) * 100
    };
  }
}

export async function bulkInsert(db, customers) {
  const batchSize = 1000;
  
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const tx = db.transaction('customers', 'readwrite');
    await Promise.all(batch.map(c => tx.store.add(c)));
    await tx.done;
  }
}

// Paginated fetch
export async function getCustomersPaginated(db, offset = 0, limit = 30) {
  const tx = db.transaction('customers', 'readonly');
  const store = tx.objectStore('customers');
  
  const customers = [];
  let cursor = await store.openCursor();
  let skipped = 0;
  
  while (cursor) {
    if (skipped < offset) {
      skipped++;
      cursor = await cursor.continue();
      continue;
    }
    
    if (customers.length >= limit) {
      break;
    }
    
    customers.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return customers;
}

export async function getCustomersBatch(db, startId = 1, batchSize = 100) {
  const tx = db.transaction('customers', 'readonly');
  const store = tx.objectStore('customers');
  
  const range = IDBKeyRange.lowerBound(startId);
  return await store.getAll(range, batchSize);
}

export async function getCustomerCount(db) {
  return await db.count('customers');
}

// searching
export async function searchCustomers(db, query, limit = 1000) {
  const tx = db.transaction('customers', 'readonly');
  const store = tx.objectStore('customers');
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  let cursor = await store.openCursor();
  
  while (cursor && results.length < limit) {
    const customer = cursor.value;
    if (
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(query)
    ) {
      results.push(customer);
    }
    cursor = await cursor.continue();
  }
  
  return results;
}

export async function getAllCustomers(db) {
  return await db.getAll('customers');
}
