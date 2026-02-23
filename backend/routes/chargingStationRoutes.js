const express = require('express');
const router = express.Router();
const {
    getStations,
    createStation,
    updateStation,
    deleteStation
} = require('../controllers/chargingStationController');

router.route('/')
    .get(getStations)
    .post(createStation);

router.route('/:id')
    .put(updateStation)
    .delete(deleteStation);

module.exports = router;
