const express = require('express');
const router = express.Router();
const { reportBug, getAllBugs, updateBugStatus, deleteBug } = require('../controllers/bugController');

router.post('/', reportBug);
router.get('/', getAllBugs);
router.patch('/:id/status', updateBugStatus);
router.delete('/:id', deleteBug);

module.exports = router;
