const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');
const User = require('./userModel');

const blogSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		description: schemaTemplate.description,
		tags: schemaTemplate.tags,
		banner: {
			type: String,
			// required: [true, 'Banner image is required'],
		},
		photos: [String],
		likes: [
			{
				type: mongoose.Schema.ObjectId,
				ref: User,
			},
		],
		dislikes: [
			{
				type: mongoose.Schema.ObjectId,
				ref: User,
			},
		],
		author: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

blogSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

blogSchema.virtual('comments', {
	ref: 'Comment',
	foreignField: 'blog',
	localField: '_id',
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
