require('dotenv').config({ path: '.env' });
console.log("USER:", process.env.ADMIN_USERNAME);
console.log("HASH:", process.env.ADMIN_PASSWORD_HASH);
const bcrypt = require('bcrypt');
bcrypt.compare('admin123', process.env.ADMIN_PASSWORD_HASH || '').then(console.log);
