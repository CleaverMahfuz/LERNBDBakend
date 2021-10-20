// 3rd party modules
const multer = require('multer');
const sharp = require('sharp');
// custom modules
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiQueryFeatures');

const idNotFoundError = new AppError('No document found with that ID', 404);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Unsupported file type. Please upload only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

exports.uploadImage = upload.single('photo');

exports.resizeImage = (width, height) => (req, res, next) => {
	const folder = req.originalUrl.split('/')[3];
	const filename = `${folder.slice(0, folder.length - 1)}-${Date.now()}-${Math.floor(
		Math.random() * 10000,
	)}.jpeg`;

	req.body.imgPrefFolder = folder;
	req.body.imgPrefFile = filename;
	req.body.imgPrefWidth = width;
	req.body.imgPrefHeight = height;

	next();
};

exports.savaImage = catchAsync(async (req, res, next) => {
	const { imgPrefFolder, imgPrefFile, imgPrefWidth, imgPrefHeight } = req.body;

	if (!req.file) return next();

	req.body.imgPrefFilename = `/img/${imgPrefFolder}/${imgPrefFile}`;

	await sharp(req.file.buffer)
		.resize(imgPrefWidth, imgPrefHeight)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`${__dirname}/../../public/img/${imgPrefFolder}/${imgPrefFile}`);

	next();
});

exports.deleteOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc) {
			return next(idNotFoundError);
		}

		res.status(204).json({
			status: 'success',
			data: null,
		});
	});

exports.updateOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!doc) {
			return next(idNotFoundError);
		}

		res.status(200).json({
			status: 'success',
			data: doc,
		});
	});

exports.createOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.create(req.body);

		res.status(201).json({
			status: 'success',
			data: doc,
		});
	});

exports.getOne = (Model, populateOption) =>
	catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id);
		if (populateOption) query = query.populate(populateOption);
		const doc = await query;

		if (!doc) {
			return next(idNotFoundError);
		}

		res.status(200).json({
			status: 'success',
			data: doc,
		});
	});

exports.getAll = (Model) =>
	catchAsync(async (req, res, next) => {
		// To allow for nested GET reviews (hack)
		let filter = {};
		if (req.params.courseId) filter = { course: req.params.courseId };
		else if (req.params.postId) filter = { post: req.params.postId };

		const features = new APIFeatures(Model.find(filter), req.query)
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
