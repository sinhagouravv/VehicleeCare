const express = require('express');
const router = express.Router();
const {
    createRemark,
    getAllRemarks,
    updateRemarkStatus,
    deleteRemark
} = require('../controllers/remarkController');

router.post('/', createRemark);
router.get('/', getAllRemarks);
router.patch('/:id/status', updateRemarkStatus);
router.delete('/:id', deleteRemark);

module.exports = router;
