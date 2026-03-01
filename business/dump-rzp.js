const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Use a proper local file to avoid data URI cors issues
  fs.writeFileSync('temp.html', `
    <html>
      <head>
        <title>Test</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <script>
          window.onload = () => {
            const options = {
                "key": "rzp_test_SDOW0Mi3saqtVB",
                "amount": "100",
                "name": "Acme Corp"
            };
            const rzp1 = new Razorpay(options);
            rzp1.open();
          };
        </script>
      </body>
    </html>
  `);
  
  await page.goto('file://' + __dirname + '/temp.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4000));
  
  const dom = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('rzp-output.html', dom);
  console.log("DOM saved");
  
  await browser.close();
})();
