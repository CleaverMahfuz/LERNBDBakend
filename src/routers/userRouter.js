// 3rd party modules
const express = require('express');
// custom modules
const {
	getByUserName,
	updateMe,
	deleteMe,
	enrollMe,
	getMe,
	getUser,
} = require('../controllers/userController');
const {
	signup,
	login,
	logout,
	protect,
	updateEmail,
	updatePassword,
	forgotPassword,
	resetPassword,
} = require('../controllers/authController');
const { uploadImage, resizeImage, savaImage } = require('../controllers/controllerFactory');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').patch(resetPassword);

router.route('/me').get(protect, getMe, getUser);
router.route('/update').patch(protect, uploadImage, resizeImage(500, 500), savaImage, updateMe);
router.route('/update-email').patch(protect, updateEmail);
router.route('/update-password').patch(protect, updatePassword);
router.route('/delete').delete(protect, deleteMe);
router.route('/enroll/:courseId').patch(protect, enrollMe);

router.route('/:username').get(getByUserName);

module.exports = router;
