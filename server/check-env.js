require('dotenv').config();

console.log('=== Environment Variables ===');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length);
console.log('DB_PASSWORD bytes:', Buffer.from(process.env.DB_PASSWORD || '').toString('hex'));

// Also check the raw file
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const passwordLine = envContent.split('\n').find(line => line.startsWith('DB_PASSWORD='));
console.log('\nRaw .env line:', passwordLine);
const extractedPassword = passwordLine?.split('=')[1];
console.log('Extracted password:', extractedPassword);
console.log('Extracted password bytes:', Buffer.from(extractedPassword || '').toString('hex'));
