// 3rd party modules
const express = require('express');
// custom modules
const Model = require('../models/tagModel');
const {
	deleteOne,
	updateOne,
	createOne,
	getOne,
	getOneAuth,
	getAll,
} = require('../controllers/resourceController');
const { protect, restrict } = require('../controllers/authController');

const router = express.Router();

router.route('/auth').post(protect, restrict('instructor', 'moderator', 'admin'), createOne(Model));
router
	.route('/auth/:id')
	.get(protect, restrict('instructor', 'moderator', 'admin'), getOneAuth(Model))
	.patch(protect, restrict('instructor', 'moderator', 'admin'), updateOne(Model))
	.delete(protect, restrict('instructor', 'moderator', 'admin'), deleteOne(Model));

router.get('/', getAll(Model));
router.get('/:id', getOne(Model));

module.exports = router;
