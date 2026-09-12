const express = require('express');
const router = express.Router();
const { reportBug, getAllBugs, getDeveloperBugs, updateBugStatus, deleteBug } = require('../controllers/bugController');

router.post('/', reportBug);
router.get('/', getAllBugs);
router.get('/developer/:empId', getDeveloperBugs);
router.patch('/:id/status', updateBugStatus);
router.delete('/:id', deleteBug);

module.exports = router;
