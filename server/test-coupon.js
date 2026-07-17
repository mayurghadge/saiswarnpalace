
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');
const { applyCoupon } = require('./controllers/couponController');

// Mock request and response
const mockReq = {
  body: {
    code: 'WELCOME10',
    totalAmount: 2000
  }
};

const mockRes = {
  status: (code) => {
    console.log('Status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
};

async function test() {
  try {
    const pool = await connectDB();
    console.log('DB connected');
    await applyCoupon(mockReq, mockRes);
    await pool.close();
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
