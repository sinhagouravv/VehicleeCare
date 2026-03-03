const fs = require('fs');
const content = fs.readFileSync('business/src/pages/Business.jsx', 'utf8');
if (!content.includes('RegistrationModal')) {
    console.log("NOT FOUND IN CURRENT FILE");
}
