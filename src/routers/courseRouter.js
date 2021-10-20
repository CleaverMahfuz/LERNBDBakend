// 3rd party modules
const express = require('express');
// custom modules
const Model = require('../models/courseModel');
const {
	deleteOne,
	updateOne,
	createOne,
	getOne,
	getOneAuth,
	getAll,
} = require('../controllers/resourceController');
const { protect, restrict } = require('../controllers/authController');
const { uploadImage, resizeImage, savaImage } = require('../controllers/controllerFactory');

const router = express.Router();

router
	.route('/auth')
	.post(
		protect,
		restrict('instructor', 'admin'),
		uploadImage,
		resizeImage(720, 480),
		savaImage,
		createOne(Model),
	);
router
	.route('/auth/:id')
	.get(protect, restrict('instructor', 'admin'), getOneAuth(Model))
	.patch(
		protect,
		restrict('instructor', 'admin'),
		uploadImage,
		resizeImage(720, 480),
		savaImage,
		updateOne(Model),
	)
	.delete(protect, restrict('instructor', 'admin'), deleteOne(Model));

router.get('/', getAll(Model));
router.get('/:id', getOne(Model));

module.exports = router;
