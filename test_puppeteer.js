const { execSync } = require('child_process');

try {
  execSync('npm view puppeteer version', { stdio: 'ignore' });
} catch (e) {
  console.log('Puppeteer not installed');
  process.exit(1);
}
