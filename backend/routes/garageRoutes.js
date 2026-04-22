const express = require('express');
const router = express.Router();
const { getGarages, createGarage, updateGarage, deleteGarage, getGarageById } = require('../controllers/garageController');

router.get('/', getGarages);
router.get('/:id', getGarageById);
router.post('/', createGarage);
router.put('/:id', updateGarage);
router.delete('/:id', deleteGarage);


module.exports = router;
