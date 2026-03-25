const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('Admin123!', 10));