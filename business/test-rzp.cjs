const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const html = `
    <html>
      <head><title>Test</title></head>
      <body>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          const options = {
              "key": "rzp_test_SDOW0Mi3saqtVB",
              "amount": "100",
              "name": "Acme Corp"
          };
          const rzp1 = new Razorpay(options);
          rzp1.open();
        </script>
      </body>
    </html>
  `;
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  const containerHTML = await page.evaluate(() => {
    const container = document.querySelector('.razorpay-container');
    return container ? container.outerHTML : 'No container';
  });
  console.log(containerHTML);
  await browser.close();
})();
