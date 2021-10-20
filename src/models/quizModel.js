const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const quizSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		subject: schemaTemplate.subject,
		questions: [
			{
				question: schemaTemplate.question,
				option1: schemaTemplate.option,
				option2: schemaTemplate.option,
				option3: schemaTemplate.option,
				option4: schemaTemplate.option,
				answer: schemaTemplate.answer,
			},
		],
		addedBy: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

quizSchema.index({ subject: 1 });

quizSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
