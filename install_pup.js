const { execSync } = require('child_process');
try {
  execSync('PUPPETEER_SKIP_DOWNLOAD=true npm install puppeteer', { stdio: 'inherit' });
  console.log('Installed puppet');
} catch (e) {
  console.log('Failed');
}
