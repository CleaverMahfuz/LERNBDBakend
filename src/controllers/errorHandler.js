const AppError = require('../utils/appError');

function handleJWTError() {
	return new AppError('Your token is invalid! Please log in again', 401);
}

function handleTokenExpiredError() {
	return new AppError('Your token has expired! Please log in again', 401);
}

function handleCastErrorDB(err) {
	return new AppError(`${err.value} cannot be used as ${err.path.toLowerCase()}`, 400);
}

function handleValidationErrorDB(err) {
	const errors = Object.values(err.errors).map((el) => el.message);
	return new AppError(`${errors.join('. ')}`, 400);
}

function handleDuplicateFieldDB(err) {
	const value = err.message.split(' { ')[1].split(':')[0].toLowerCase();
	// .match(/[^{}]+(?=})/)[0].trim().split(':')[0].toUpperCase();
	// Another Regex: /{([^}]+)}/
	return new AppError(`This ${value} is already in use`, 400);
}

function sendErrorDev(err, res) {
	console.error(err);

	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
		stack: err.stack,
		error: err,
	});
}

function sendErrorProd(err, res) {
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	} else {
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong in the server.',
		});
	}
}

function errorHandler(err, req, res, next) {
	let error = { ...err };
	error.statusCode = err.statusCode || 500;
	error.status = err.status || 'error';
	error.message = err.message || 'Internal server error';

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(error, res);
	} else if (process.env.NODE_ENV === 'production') {
		if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
		if (err.name === 'TokenExpiredError') error = handleTokenExpiredError(error);
		if (err.name === 'CastError') error = handleCastErrorDB(error);
		if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
		if (err.code === 11000) error = handleDuplicateFieldDB(error);
		sendErrorProd(error, res);
	}
	next();
}

module.exports = errorHandler;
