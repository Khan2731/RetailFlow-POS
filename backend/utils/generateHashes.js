const bcrypt = require('bcryptjs');

const users = [
  { username: 'john', password: 'password123' },
  { username: 'sarah', password: 'password123' },
  { username: 'mike', password: 'password123' },
  { username: 'emily', password: 'password123' },
  { username: 'david', password: 'password123' },
  { username: 'lisa', password: 'password123' },
  { username: 'tom', password: 'password123' }
];

console.log('Generating bcrypt hashes for seed data...\n');

users.forEach(user => {
  const hash = bcrypt.hashSync(user.password, 10);
  console.log(`'${user.username}': '${hash}',`);
});

console.log('\nCopy these hashes into seed.sql');
