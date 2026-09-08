const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer directly to Cloudinary using streams.
 * @param {Buffer} fileBuffer - The file buffer from Multer memory storage.
 * @param {string} folder - The folder name in Cloudinary.
 * @returns {Promise<object>} The upload result from Cloudinary.
 */
const uploadStream = (fileBuffer, folder = 'employee_avatars', mimeType = 'image/png') => {
    return new Promise((resolve) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: 'auto' },
            (error, result) => {
                if (error || !result) {
                    console.error('Cloudinary stream upload error, generating base64 fallback:', error);
                    const b64 = fileBuffer.toString('base64');
                    const mime = mimeType || 'image/png';
                    const dataUrl = `data:${mime};base64,${b64}`;
                    return resolve({ secure_url: dataUrl });
                }
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

module.exports = {
    cloudinary,
    uploadStream
};
