const mongoose = require('mongoose');
const User = require('./userModel');
const Blog = require('./blogModel');

const commentSchema = new mongoose.Schema(
	{
		comment: {
			type: String,
			required: [true, 'Comment can not be empty'],
			trim: true,
			minLength: [2, 'Comment must have at least 2 charecters'],
			maxLength: [300, 'Comment must have at most 300 charecters'],
		},
		blog: {
			type: mongoose.Schema.ObjectId,
			ref: Blog,
			required: [true, 'Comment must belong to a blog.'],
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: User,
			required: [true, 'Comment must belong to a user'],
		},
	},
	{
		timestamps: true,
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

commentSchema.index({ blog: 1, user: 1 }, { unique: true });

commentSchema.pre(/^find/, function populateUser(next) {
	this.populate({
		path: 'user',
		select: 'fullName photo',
	});
	next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
