const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const Blog = require('./blogModel');
const Course = require('./courseModel');

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: [true, 'Full name is required'],
			trim: true,
			minLength: [4, 'Full name must have at least 4 charecters'],
			maxLength: [50, 'Full name must have at most 50 charecters'],
		},
		userName: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			lowercase: true,
			minLength: [3, 'Username must have at least 3 charecters'],
			maxLength: [30, 'Username must have at most 30 charecters'],
			validate: {
				validator: validator.isAlphanumeric,
				message: 'Username should contain english letters and numbers only',
			},
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			validate: {
				validator: validator.isEmail,
				message: 'This email is invalid',
			},
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			validate: {
				validator: validator.isStrongPassword,
				message: 'This password is not strong enough',
			},
			select: false,
		},
		passwordConfirm: {
			type: String,
			required: [true, 'Confirmation password is required'],
			validate: {
				validator: function confirmPassword(value) {
					// this points to current document during CREAT and SAVE only
					return value === this.password;
				},
				message: 'Confirmation password did not match',
			},
		},
		passwordResetToken: {
			type: String,
			default: '',
			select: false,
		},
		passwordResetExpiresAt: {
			type: Date,
			default: new Date('2000-01-01T12:00:00'),
			select: false,
		},
		passwordChangedAt: {
			type: Date,
			default: new Date('2000-01-01T12:00:00'),
			select: false,
		},
		role: {
			type: String,
			default: 'user',
			enum: {
				values: ['user', 'instructor', 'moderator', 'admin'],
				message: 'Role should be user / instructor / moderator',
			},
		},
		gender: {
			type: String,
			default: 'unknown',
			enum: {
				values: ['male', 'female', 'other', 'unknown'],
				message: 'Gender should be male / female / other',
			},
		},
		photo: {
			type: String,
			default: '/img/users/default.jpg',
		},
		birthDate: {
			type: Date,
			default: new Date('2000-01-01T12:00:00'),
		},
		premiumExpiresAt: {
			type: Date,
			default: new Date('2000-01-01T12:00:00'),
		},
		courses: [
			{
				type: mongoose.Schema.ObjectId,
				ref: Course,
				unique: true,
			},
		],
		blogs: [
			{
				type: mongoose.Schema.ObjectId,
				ref: Blog,
				unique: true,
			},
		],
		isActive: {
			type: Boolean,
			default: true,
			select: false,
		},
	},
	{
		timestamps: true,
	},
);

// Encrypt the password if it was modified
userSchema.pre('save', async function encryptPassword(next) {
	if (!this.isModified('password')) return next();

	this.password = await bcrypt.hash(this.password, 12);
	this.passwordConfirm = undefined;

	next();
});

userSchema.pre('save', async function updatepasswordChangedAt(next) {
	if (!this.isModified('email') || !this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 3000;

	next();
});

userSchema.pre(/^find/, function hideInactiveUsers(next) {
	// this points to the current query
	this.find({ isActive: { $ne: false } });
	next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePass, actualPass) {
	const isMatching = await bcrypt.compare(candidatePass, actualPass);
	return isMatching;
};

userSchema.methods.passwordChangedAfterJWT = function passwordChangedAfterJWT(
	timestamp,
	passwordChangedAt,
) {
	if (passwordChangedAt) {
		const changedTimestamp = parseInt(passwordChangedAt.getTime() / 1000, 10);

		return timestamp < changedTimestamp;
	}
	return false;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpiresAt = Date.now() + 360000;

	return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
