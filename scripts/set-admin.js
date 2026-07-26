const fs = require('fs');
const readline = require('readline');
const bcrypt = require('bcrypt');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let isMasking = false;

// Override to mask password input with asterisks
rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (isMasking && stringToWrite !== '\r\n' && stringToWrite !== '\n') {
    rl.output.write("*");
  } else {
    rl.output.write(stringToWrite);
  }
};

console.log('--- Admin Credentials Setup ---');
isMasking = true;
rl.question('Enter your new secure admin password: ', async (password) => {
  isMasking = false;
  console.log('\nGenerating secure hash...');
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const envPath = path.join(__dirname, '..', '.env');
    let env = fs.readFileSync(envPath, 'utf8');
    
    // Escape the dollar signs for Next.js .env parser!
    const escapedHash = hash.replace(/\$/g, '\\$');
    
    // Update the hash in .env
    env = env.replace(/ADMIN_PASSWORD_HASH=".*"/, `ADMIN_PASSWORD_HASH="${escapedHash}"`);
    fs.writeFileSync(envPath, env);
    
    console.log('\n✅ Success! Your password has been updated in .env.');
    console.log('   You can now log in at http://localhost:3000/admin/login');
    console.log('   Username: SurveyAdmin\n');
  } catch (error) {
    console.error('Error updating password:', error);
  }
  
  rl.close();
});
