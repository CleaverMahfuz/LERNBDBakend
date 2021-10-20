module.exports = (catchAsync) => (req, res, next) => {
	catchAsync(req, res, next).catch((err) => next(err));
};
