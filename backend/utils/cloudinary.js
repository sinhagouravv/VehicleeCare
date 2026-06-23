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
const uploadStream = (fileBuffer, folder = 'employee_avatars') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary stream upload error:', error);
                    return reject(error);
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
