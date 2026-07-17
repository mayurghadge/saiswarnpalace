
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { applyCoupon } = require('./controllers/couponController');

const mockReq = {
  body: {
    code: 'DIWALI20',
    totalAmount: 3000
  }
};

const mockRes = {
  status: (code) => {
    console.log('Status code:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response data:', JSON.stringify(data, null, 2));
  }
};

applyCoupon(mockReq, mockRes)
  .then(() => {
    console.log('Test complete');
  })
  .catch(err => {
    console.error('Test failed:', err);
  });
