const express = require('express');
const router = express.Router();
const { getCarsByType } = require('../controllers/carController');

router.get('/:type', getCarsByType);

module.exports = router;
