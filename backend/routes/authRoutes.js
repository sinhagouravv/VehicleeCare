const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.patch('/update-profile', authController.updateProfile);
router.post('/send-settings-otp', authController.sendSettingsOtp);
router.patch('/change-password-otp', authController.changePasswordOtp);
router.delete('/delete-account', authController.deleteAccount);

module.exports = router;
