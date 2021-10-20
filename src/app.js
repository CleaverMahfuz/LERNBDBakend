// 3rd party modules
// const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

// custom modules
const AppError = require('./utils/appError');
const errorHandler = require('./controllers/errorHandler');
const blogRouter = require('./routers/blogRouter');
const courseRouter = require('./routers/courseRouter');
const jobCircularRouter = require('./routers/jobCircularRouter');
const pdfBookRouter = require('./routers/pdfBookRouter');
const questionBankRouter = require('./routers/questionBankRouter');
const quizRouter = require('./routers/quizRouter');
const tagsRouter = require('./routers/tagsRouter');
const tutorialVideoRouter = require('./routers/tutorialVideoRouter');
const userRouter = require('./routers/userRouter');
const userRouterAdmin = require('./routers/userRouterAdmin');

const app = express();

app.enable('trust proxy');

app.use(helmet());

/* 
const whitelist = [
	'https://azshayak.github.io',
	'http://localhost:3000',
	'http://localhost:3001',
	'http://127.0.0.1:3000',
	'http://127.0.0.1:3001',
]; 
*/
const corsOptions = {
	credentials: true,
	origin: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('combined'));
}

const limiter = rateLimit({
	max: 100,
	windowMs: 3600000,
	message: 'Too many reqestes! Try again later.',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* 
app.post(
	'/webhook-checkout',
	bodyParser.raw({ type: 'application/json' }),
	bookingController.webhookCheckout,
);
*/

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xssClean());

app.use(hpp({ whitelist: ['duration'] }));

app.use(compression());

app.set('view engine', 'pug');
app.set('views', `${__dirname}/views`);

app.use(express.static(`${__dirname}/../public`));

app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	// console.log('--ORIGIN--');
	// console.log(req.header('Origin'));
	next();
});

// Routes
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/jobs', jobCircularRouter);
app.use('/api/v1/books', pdfBookRouter);
app.use('/api/v1/questions', questionBankRouter);
app.use('/api/v1/quizzes', quizRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/tutorials', tutorialVideoRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/users-admin', userRouterAdmin);
app.all('*', function respondUndefinedRoute(req, res, next) {
	next(new AppError(`${req.originalUrl} was not found in this server.`, 404));
});

// Error Handler
app.use(errorHandler);

module.exports = app;
