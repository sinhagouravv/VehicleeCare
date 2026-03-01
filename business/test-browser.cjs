const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Listen for page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Try ports 5173, 5174, 5175, 5176
  const ports = [5173, 5174, 5175, 5176, 5177];
  for (let port of ports) {
    try {
      console.log(`Checking port ${port}...`);
      await page.goto(`http://localhost:${port}/pricing`, { waitUntil: 'networkidle0', timeout: 5000 });
      console.log(`Page on port ${port} loaded title:`, await page.title());
      // Wait a bit to capture errors
      await new Promise(r => setTimeout(r, 2000));
      break; 
    } catch (e) {
      console.log(`Port ${port} failed: ${e.message}`);
    }
  }

  await browser.close();
})();
