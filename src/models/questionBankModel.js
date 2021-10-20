const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const questionSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		driveId: schemaTemplate.driveId,
		subject: schemaTemplate.subject,
		department: schemaTemplate.department,
		class: schemaTemplate.class,
		addedBy: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

questionSchema.index({ class: 1 });
questionSchema.index({ department: 1 });

questionSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const QuestionBank = mongoose.model('QuestionBank', questionSchema);

module.exports = QuestionBank;
