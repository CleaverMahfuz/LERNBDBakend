const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const tutorialSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		link: schemaTemplate.link,
		authorName: schemaTemplate.authorName,
		subject: schemaTemplate.subject,
		description: schemaTemplate.description,
		addedBy: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

tutorialSchema.index({ subject: 1 });

tutorialSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const TutorialVideo = mongoose.model('TutorialVideo', tutorialSchema);

module.exports = TutorialVideo;
