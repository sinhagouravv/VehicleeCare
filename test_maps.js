const https = require('https');

https.get('https://maps.googleapis.com/maps/api/js?key=AIzaSyCgdWL8F_-ZXY2xhQmpCxn0A3zWWeYvYWI', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('BillingNotEnabled')) {
      console.log('BillingNotEnabled found');
    } else if (data.includes('APIKeyInvalid')) {
      console.log('APIKeyInvalid found');
    } else if (data.includes('MissingKeyMapError')) {
      console.log('MissingKeyMapError found');
    } else if (data.includes('ApiNotActivatedMapError')) {
       console.log('ApiNotActivatedMapError found');
    } else {
        console.log('No specific error found in the script itself. Let\'s check the loaded script for warning.');
        // Just print if it contains "error" to see where it might be.
        const errorLines = data.split('\n').filter(line => line.toLowerCase().includes('error'));
        console.log(errorLines.slice(0, 5).join('\n'));
    }
  });
});
