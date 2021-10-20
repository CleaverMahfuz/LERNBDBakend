const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
// custom modules
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const cookieOptions = {
	sameSite: 'strict',
	path: '/',
	expires: new Date(Date.now() + 10000),
	httpOnly: true,
	secure: true,
};

/**
 * This function creates a JsonWebToken from the `user._id` then sends the token
 * and the user as `HTTP response` with the provided `statusCode`
 *
 * @param {Object} user - The the user object returned from mongoose for whom the token will be made
 * @param {Function} req - Express's request
 * @param {Function} res - Express's response
 * @param {Number} statusCode - HTTP Status code for the `res`
 * @example
 * sendUserJWTResponse(user, req, res, 202);
 */
const sendUserJWTResponse = (user, req, res, statusCode = 202) => {
	const currentUser = { ...user._doc };

	const userIdToken = jwt.sign({ id: currentUser._id }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRATION,
	});

	cookieOptions.expires = new Date(Date.now() + process.env.COOKIE_EXPIRATION * 86400000);
	cookieOptions.secure = req.secure || req.headers['x-forwarded-proto'] === 'https';

	delete currentUser.password;
	delete currentUser.passwordConfirm;
	delete currentUser.passwordResetToken;
	delete currentUser.passwordResetExpiresAt;
	delete currentUser.passwordChangedAt;
	delete currentUser.isActive;
	delete currentUser.createdAt;
	delete currentUser.updatedAt;
	delete currentUser.__v;

	res.cookie('jwt', userIdToken, cookieOptions);

	res.status(statusCode).json({
		status: 'success',
		token: userIdToken,
		data: currentUser,
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		fullName: req.body.fullName,
		userName: req.body.userName,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
	});

	const url = `${req.protocol}://${req.get('host')}/${newUser.userName}`;
	await new Email(newUser, url).sendWelcome();

	sendUserJWTResponse(newUser, req, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new AppError('Please provide email and password.', 400));
	}

	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.comparePassword(password, user.password))) {
		return next(new AppError('Incorrect email and/or password', 401));
	}

	sendUserJWTResponse(user, req, res, 202);
});

exports.logout = (req, res) => {
	cookieOptions.secure = req.secure || req.headers['x-forwarded-proto'] === 'https';

	res.cookie('jwt', '', cookieOptions);

	res.status(200).json({
		status: 'success',
		token: null,
		data: null,
	});
};

exports.protect = catchAsync(async (req, res, next) => {
	let token = '';
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.replace('Bearer ', '');
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(new AppError('Your are not authorized. Please log in first.', 401));
	}

	const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
	const currentUser = await User.findById(decodedPayload.id).select('+passwordChangedAt');
	if (!currentUser) {
		return next(new AppError('The account belonging to this token no longer exists!', 410));
	}

	const isPassChanged = currentUser.passwordChangedAfterJWT(
		decodedPayload.iat,
		currentUser.passwordChangedAt,
	);
	if (isPassChanged) {
		return next(new AppError('Your email and/or password was changed. Please log in again.', 401));
	}

	req.user = currentUser;
	res.locals.user = currentUser;
	next();
});

exports.restrict =
	(...roles) =>
	(req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action.', 403));
		}
		next();
	};

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
	if (req.cookies.jwt) {
		try {
			const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

			const currentUser = await User.findById(decoded.id);
			if (!currentUser) {
				return next();
			}

			if (currentUser.changedPasswordAfter(decoded.iat)) {
				return next();
			}

			res.locals.user = currentUser;
			return next();
		} catch (err) {
			return next();
		}
	}
	next();
};

exports.updateEmail = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new AppError('Please provide new email and your password.', 400));
	}

	const user = await User.findById(req.user.id).select('+password');

	if (!(await user.comparePassword(password, user.password))) {
		return next(new AppError('Wrong password', 401));
	}

	user.email = email;
	user.password = password;
	user.passwordConfirm = password;
	await user.save();

	sendUserJWTResponse(user, req, res, 202);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	const { passwordCurrent, password, passwordConfirm } = req.body;

	if (!passwordCurrent || !password || !passwordConfirm) {
		return next(
			new AppError('Please provide passwordCurrent, new password and passwordConfirm.', 400),
		);
	}

	const user = await User.findById(req.user.id).select('+password');

	if (!(await user.comparePassword(passwordCurrent, user.password))) {
		return next(new AppError('Your current password is wrong.', 401));
	}

	user.password = password;
	user.passwordConfirm = passwordConfirm;
	await user.save();

	sendUserJWTResponse(user, req, res, 202);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
	if (!req.body.email) {
		return next(new AppError('Please provide your email address.', 400));
	}

	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(new AppError('There is no account with this email.', 404));
	}

	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/password-reset/${resetToken}`;

	try {
		await new Email(user, resetURL).sendPasswordReset();

		res.status(200).json({
			status: 'success',
			message: `Password reset token was sent to ${user.email}. It will expire in 5 minutes.`,
		});
	} catch (err) {
		user.passwordResetToken = '';
		user.passwordResetExpiresAt = new Date('2000-01-01T12:00:00');
		await user.save({ validateBeforeSave: false });

		return next(new AppError('An error occurred while trying to send the email.', 500));
	}
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	const { password, passwordConfirm } = req.body;

	if (!password || !passwordConfirm) {
		return next(new AppError('Please provide new password and passwordConfirm.', 400));
	}

	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpiresAt: { $gt: Date.now() },
	});

	if (!user) {
		return next(new AppError('The token is invalid or has expired.', 400));
	}

	user.password = password;
	user.passwordConfirm = passwordConfirm;
	user.passwordResetToken = '';
	user.passwordResetExpiresAt = new Date('2000-01-01T12:00:00');
	user.passwordChangedAt = Date.now();
	await user.save();

	sendUserJWTResponse(user, req, res, 202);
});
