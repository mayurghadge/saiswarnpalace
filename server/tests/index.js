// Root test harness for the server tests.
// `npm test` runs this file, which imports all individual tests.

require('./adminAuthorization.test.js');
require('./adminController.test.js');
require('./userController.test.js');
require('./refreshLogout.endpoints.test.js');
require('./csrf.test.js');
