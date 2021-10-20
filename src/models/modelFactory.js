const mongoose = require('mongoose');

exports.schemaTemplate = {
	title: {
		type: String,
		required: [true, 'Title is required'],
		unique: true,
		trim: true,
		minLength: [4, 'Title must have at least 4 charecters'],
		maxLength: [100, 'Title must have at most 100 charecters'],
	},
	driveId: {
		type: String,
		required: [true, 'Google Drive File ID is required'],
		trim: true,
		minLength: [30, 'Google Drive File ID must have at least 30 charecters'],
		maxLength: [35, 'Google Drive File ID must have at most 35 charecters'],
	},
	link: {
		type: String,
		required: [true, 'Link is required'],
		trim: true,
		minLength: [10, 'Link must have at least 10 charecters'],
		maxLength: [300, 'Link must have at most 300 charecters'],
	},
	authorName: {
		type: String,
		default: 'Anonymous',
		trim: true,
		minLength: [4, 'Author Name must have at least 4 charecters'],
		maxLength: [50, 'Author Name must have at most 50 charecters'],
	},
	question: {
		type: String,
		required: [true, 'Question is required'],
		trim: true,
		minLength: [5, 'Question must have at least 5 charecters'],
		maxLength: [200, 'Question must have at most 200 charecters'],
	},
	option: {
		type: String,
		required: [true, 'Option is required'],
		trim: true,
		minLength: [3, 'Option must have at least 3 charecters'],
		maxLength: [100, 'Option must have at most 100 charecters'],
	},
	answer: {
		type: Number,
		required: [true, 'Answer is required'],
		min: [1, 'Answer must be 1 or above'],
		max: [4, 'Answer must be 4 or below'],
		set: (val) => Math.floor(val),
	},
	price: {
		type: Number,
		default: 0,
	},
	tags: [
		{
			type: String,
		},
	],
	tagsRef: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'Tag',
		},
	],
	subject: {
		type: String,
		required: [true, 'Subject is required'],
		trim: true,
		minLength: [3, 'Subject must have at least 3 charecters'],
		maxLength: [30, 'Subject must have at most 30 charecters'],
	},
	department: {
		type: String,
		required: [true, 'Department is required'],
		trim: true,
		minLength: [3, 'Department must have at least 3 charecters'],
		maxLength: [30, 'Department must have at most 30 charecters'],
	},
	class: {
		type: String,
		required: [true, 'Class is required'],
		enum: {
			values: ['jsc', 'ssc', 'hsc', 'admission', 'job', 'bcs'],
			message: 'Class should be jsc / ssc / hsc / admission / job / bcs',
		},
	},
	description: {
		type: String,
		default: '',
		trim: true,
		maxLength: [5000, 'Description must have at most 5000 charecters'],
	},
	photo: {
		type: String,
		default: '/img/books/default.jpeg',
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
	},
	addedBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Document must belong to a registered user'],
	},
	updatedBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Document must be updated by a registered user'],
	},
	isActive: {
		type: Boolean,
		default: true,
		select: false,
	},
};
