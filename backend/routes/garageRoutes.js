const express = require('express');
const router = express.Router();
const { getGarages, createGarage, updateGarage, deleteGarage } = require('../controllers/garageController');

router.get('/', getGarages);
router.post('/', createGarage);
router.put('/:id', updateGarage);
router.delete('/:id', deleteGarage);

module.exports = router;
