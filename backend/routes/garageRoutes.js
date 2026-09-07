const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure Multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const { getGarages, createGarage, updateGarage, deleteGarage, getGarageById, uploadGarageDocument, deleteGarageDocument } = require('../controllers/garageController');

router.get('/', getGarages);
router.get('/:id', getGarageById);
router.post('/', createGarage);
router.put('/:id', updateGarage);
router.delete('/:id', deleteGarage);
router.post('/:id/document', upload.single('document'), uploadGarageDocument);
router.delete('/:id/document/:documentType', deleteGarageDocument);

module.exports = router;
