// 3rd party modules
const express = require('express');
// custom modules

const {
	uploadBlogImages,
	saveBlogImages,
	createOne,
	updateOne,
	likeOne,
	dislikeOne,
	deleteOne,
	getOne,
	getAll,
	getAllComments,
	createOneComment,
	deleteOneComment,
} = require('../controllers/blogController');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.route('like/:id').patch(protect, likeOne);
router.route('dislike/:id').patch(protect, dislikeOne);

router.route('comment/').get(getAllComments).post(protect, createOneComment);
router.route('comment/:id').delete(protect, deleteOneComment);

router.route('/').get(getAll).post(protect, uploadBlogImages, saveBlogImages, createOne);
router
	.route('/:id')
	.get(getOne)
	.patch(protect, uploadBlogImages, saveBlogImages, updateOne)
	.delete(protect, deleteOne);

module.exports = router;
