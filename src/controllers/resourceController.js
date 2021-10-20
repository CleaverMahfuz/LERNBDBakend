// custom modules
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiQueryFeatures');

const idNotFoundError = new AppError('No document found with that ID', 404);

exports.createOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const data = req.body;
		data.addedBy = req.user.id;
		data.updatedBy = req.user.id;
		data.instructor = req.user.id;

		if (req.body.imgPrefFilename) data.photo = req.body.imgPrefFilename;

		const doc = await Model.create(data);

		res.status(201).json({
			status: 'success',
			data: doc,
		});
	});

exports.updateOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const data = req.body;
		data.updatedBy = req.user.id;

		if (req.body.imgPrefFilename) data.photo = req.body.imgPrefFilename;

		const doc = await Model.findByIdAndUpdate(req.params.id, data, {
			new: true,
			runValidators: true,
		});

		if (!doc) return next(idNotFoundError);

		res.status(200).json({
			status: 'success',
			data: doc,
		});
	});

exports.deleteOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc) return next(idNotFoundError);

		res.status(204).json({
			status: 'success',
			data: null,
		});
	});

exports.getOneAuth = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findById(req.params.id).populate({
			path: 'instructor addedBy updatedBy',
			select: 'fullName userName role',
			strictPopulate: false,
		});

		if (!doc) return next(idNotFoundError);

		res.status(200).json({
			status: 'success',
			data: doc,
		});
	});

exports.getOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findById(req.params.id).select('-addedBy -updatedBy').populate({
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

exports.getAll = (Model) =>
	catchAsync(async (req, res, next) => {
		const features = new APIFeatures(
			Model.find().select('-addedBy -updatedBy').populate({
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
