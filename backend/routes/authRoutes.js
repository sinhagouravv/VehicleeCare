const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.post('/admin-forgot-password', authController.adminForgotPassword);
router.post('/admin-verify-reset-otp', authController.adminVerifyResetOtp);
router.post('/admin-reset-password', authController.adminResetPassword);

// Garage Auth Routes
router.post('/garage-login', authController.garageLogin);
router.post('/garage-forgot-password', authController.garageForgotPassword);
router.post('/garage-verify-reset-otp', authController.garageVerifyResetOtp);
router.post('/garage-reset-password', authController.garageResetPassword);

// Business Auth Routes
router.post('/business-register', authController.businessRegister);
router.post('/business-login', authController.businessLogin);
router.post('/business-forgot-password', authController.businessForgotPassword);
router.post('/business-verify-reset-otp', authController.businessVerifyResetOtp);
router.post('/business-reset-password', authController.businessResetPassword);

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.patch('/update-profile', authController.updateProfile);
router.post('/me', authController.getMe);
router.post('/send-settings-otp', authController.sendSettingsOtp);
router.patch('/change-password-otp', authController.changePasswordOtp);
router.delete('/delete-account', authController.deleteAccount);

module.exports = router;
