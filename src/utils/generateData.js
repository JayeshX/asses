function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'James', 'Mary', 'Robert', 'Patricia', 'William', 'Jennifer', 'Richard', 'Linda', 'Joseph', 'Barbara'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'mail.com'];

function generateEmail(firstName, lastName) {
  const name = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}`;
  return `${name}@${randomChoice(domains)}`;
}

function generatePhone() {
  return `+917${randomInt(100000000, 999999999)}`;
}

function generateDate() {
  const now = new Date();
  const daysAgo = randomInt(0, 30);
  return new Date(now - daysAgo * 24 * 60 * 60 * 1000);
}

function generateAvatar(name) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
}

export async function* generateCustomersWithProgress(count = 1000000) {
  const customers = [];
  const batchSize = 10000; 
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    customers.push({
      id: i + 1,
      name: fullName,
      phone: generatePhone(),
      email: generateEmail(firstName, lastName),
      score: randomInt(1, 100),
      lastMessageAt: generateDate(),
      addedBy: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
      avatar: generateAvatar(fullName + i)
    });
    
    // trying to yeild progress
    if ((i + 1) % batchSize === 0 || i === count - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      yield {
        generated: i + 1,
        total: count,
        customers: i === count - 1 ? customers : null,
        done: i === count - 1
      };
    }
  }
  
  return customers;
}

// generating data
export function generateCustomers(count = 1000000) {
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    customers.push({
      id: i + 1,
      name: fullName,
      phone: generatePhone(),
      email: generateEmail(firstName, lastName),
      score: randomInt(1, 100),
      lastMessageAt: generateDate(),
      addedBy: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
      avatar: generateAvatar(fullName + i)
    });
  }
  
  return customers;
}
