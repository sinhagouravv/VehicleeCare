const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs');

const secret = speakeasy.generateSecret({ length: 20, name: 'VehicleeCare Admin' });
console.log('--- SAVE THIS SECRET IN .env ---');
console.log(`ADMIN_TOTP_SECRET=${secret.base32}`);

QRCode.toFile('setup-2fa.png', secret.otpauth_url, (err) => {
    if (err) throw err;
    console.log('QR Code saved as setup-2fa.png');
});
