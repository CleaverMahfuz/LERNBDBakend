const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./controllerFactory');

const filterObject = (obj, ...fields) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (fields.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

exports.getByUserName = catchAsync(async (req, res, next) => {
	const user = await User.findOne({ userName: req.params.username }).select(
		'-_id -email -role -premiumExpiresAt -createdAt -updatedAt -__v',
	);

	if (!user) return next(new AppError('No user found with that username', 404));

	res.status(200).json({
		status: 'success',
		data: user,
	});
	next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
	const filteredBody = filterObject(req.body, 'fullName', 'gender', 'photo', 'birthDate');

	if (req.body.imgPrefFilename) filteredBody.photo = req.body.imgPrefFilename;

	const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	res.status(202).json({
		status: 'success',
		data: updateUser,
	});
});

exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { isActive: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

exports.enrollMe = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	if (user.courses.indexOf(req.params.courseId) === -1) {
		const newUser = await User.findByIdAndUpdate(
			req.user.id,
			{ $push: { courses: req.params.courseId } },
			{
				new: true,
				runValidators: true,
			},
		);

		return res.status(202).json({
			status: 'success',
			data: newUser,
		});
	}

	return res.status(202).json({
		status: 'success',
		data: user,
	});
});

exports.getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();
};

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

exports.updateUser = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(
		req.params.id,
		{ role: req.body.role },
		{ new: true, runValidators: true },
	);

	if (!user) return next(new AppError('No user found with that ID', 404));

	res.status(202).json({
		status: 'success',
		data: user,
	});
});

exports.deleteUser = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(req.params.id, { isActive: false });

	if (!user) return next(new AppError('No user found with that ID', 404));

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
