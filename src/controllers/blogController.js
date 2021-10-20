const multer = require('multer');
const sharp = require('sharp');
// custom modules
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiQueryFeatures');
const User = require('../models/userModel');
const Blog = require('../models/blogModel');
const Comment = require('../models/commentModel');

const idNotFoundError = new AppError('No document found with that ID', 404);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

exports.uploadBlogImages = upload.fields([
	{ name: 'banner', maxCount: 1 },
	{ name: 'photos', maxCount: 10 },
]);

exports.saveBlogImages = catchAsync(async (req, res, next) => {
	if (!req.files.banner || !req.files.photos) return next();

	req.body.banner = `/img/blogs/blog-${req.params.id}-${Date.now()}-banner.jpeg`;
	await sharp(req.files.banner[0].buffer)
		.resize(720, 480)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`${__dirname}/../../public${req.body.banner}`);

	req.body.photos = [];

	await Promise.all(
		req.files.photos.map(async (file, i) => {
			const filename = `/img/blogs/blog-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

			await sharp(file.buffer)
				.resize({
					width: 720,
					height: 720,
					fit: sharp.fit.inside,
				})
				.toFormat('jpeg')
				.jpeg({ quality: 80 })
				.toFile(`${__dirname}/../../public${filename}`);

			req.body.photos.push(filename);
		}),
	);

	next();
});

exports.createOne = catchAsync(async (req, res, next) => {
	const data = req.body;
	data.author = req.user.id;
	data.updatedBy = req.user.id;

	if (req.body.banner) data.banner = req.body.banner;
	if (req.body.photos) data.photos = req.body.photos;

	const doc = await Blog.create(data);

	if (doc)
		await User.findByIdAndUpdate(
			req.user.id,
			{ $push: { blogs: doc._id } },
			{ runValidators: true },
		);

	res.status(201).json({
		status: 'success',
		data: doc,
	});
});

exports.updateOne = catchAsync(async (req, res, next) => {
	const blog = await Blog.findById(req.params.id);
	if (!blog) return next(idNotFoundError);

	const data = req.body;
	data.updatedBy = req.user.id;

	if (req.body.banner) data.banner = req.body.banner;
	if (req.body.photos) data.photos = req.body.photos;

	if (req.user.role !== 'admin' || req.user.blogs.indexOf(req.params.id) === -1)
		return next(new AppError('You cannot edit this blog', 403));

	const doc = await Blog.findByIdAndUpdate(req.params.id, data, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: doc,
	});
});

exports.likeOne = catchAsync(async (req, res, next) => {
	const blog = await Blog.findById(req.params.id);
	if (!blog) return next(idNotFoundError);

	const likes = blog.likes.filter((id) => {
		if (req.user.id !== id) return;
		return id;
	});
	const dislikes = blog.dislikes.filter((id) => {
		if (req.user.id !== id) return;
		return id;
	});

	blog.likes = likes.push(req.user.id);
	blog.dislikes = dislikes;
	await blog.save();

	res.status(200).json({
		status: 'success',
		data: blog,
	});
});

exports.dislikeOne = catchAsync(async (req, res, next) => {
	const blog = await Blog.findById(req.params.id);
	if (!blog) return next(idNotFoundError);

	const likes = blog.likes.filter((id) => {
		if (req.user.id !== id) return;
		return id;
	});
	const dislikes = blog.dislikes.filter((id) => {
		if (req.user.id !== id) return;
		return id;
	});

	blog.likes = likes;
	blog.dislikes = dislikes.push(req.user.id);
	await blog.save();

	res.status(200).json({
		status: 'success',
		data: blog,
	});
});

exports.deleteOne = catchAsync(async (req, res, next) => {
	if (req.user.role !== 'admin' || req.user.blogs.indexOf(req.params.id) === -1)
		return next(new AppError('You cannot delete this blog', 403));

	const doc = await Blog.findByIdAndDelete(req.params.id);

	if (!doc) return next(idNotFoundError);

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

exports.getOne = catchAsync(async (req, res, next) => {
	const doc = await Blog.findById(req.params.id).populate({
		path: 'instructor',
		select: 'fullName userName',
		strictPopulate: false,
	});

	if (!doc) return next(idNotFoundError);

	res.status(200).json({
		status: 'success',
		data: doc,
	});
});

exports.getAll = catchAsync(async (req, res, next) => {
	const features = new APIFeatures(
		Blog.find().populate({
			path: 'instructor',
			select: 'fullName userName',
			strictPopulate: false,
		}),
		req.query,
	)
		.filter()
		.sort()
		.fields()
		.paginate();

	const docs = await features.query;

	res.status(200).json({
		status: 'success',
		totalCount: docs.length,
		data: docs,
	});
});

exports.getAllComments = catchAsync(async (req, res, next) => {
	const features = new APIFeatures(Comment.find(), req.query).filter().sort().fields().paginate();

	const docs = await features.query;

	res.status(200).json({
		status: 'success',
		totalCount: docs.length,
		data: docs,
	});
});

exports.createOneComment = catchAsync(async (req, res, next) => {
	const data = req.body;
	data.blog = req.params.id;
	data.user = req.user.id;

	const doc = await Comment.create(data);

	res.status(201).json({
		status: 'success',
		data: doc,
	});
});

exports.deleteOneComment = catchAsync(async (req, res, next) => {
	const doc = await Comment.findByIdAndDelete(req.params.id);

	if (!doc) {
		return next(idNotFoundError);
	}

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
