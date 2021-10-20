const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const { schemaTemplate } = require('./modelFactory');

const tagSchema = new mongoose.Schema({
	label: {
		type: String,
		required: [true, 'Tag label is required'],
		unique: true,
		trim: true,
		minLength: [3, 'Tag label have at least 3 charecters'],
		maxLength: [15, 'Tag label have at most 15 charecters'],
		validate: {
			validator: validator.isAlphanumeric,
			message: 'Username should contain english letters and numbers only',
		},
	},
	value: {
		type: String,
	},
	isActive: schemaTemplate.isActive,
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tagSchema.pre('save', function slugifyValue(next) {
	this.value = slugify(this.label, { lower: true });
	next();
});

tagSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
