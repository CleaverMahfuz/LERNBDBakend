const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const courseSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		subject: schemaTemplate.subject,
		photo: schemaTemplate.photo,
		description: schemaTemplate.description,
		price: schemaTemplate.price,
		tags: schemaTemplate.tags,
		modules: [
			{
				title: schemaTemplate.title,
				lessons: [
					{
						title: schemaTemplate.title,
						link: schemaTemplate.link,
						description: schemaTemplate.description,
					},
				],
			},
		],
		instructor: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

courseSchema.index({ subject: 1 });

courseSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
