const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const jobSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		link: schemaTemplate.link,
		department: schemaTemplate.department,
		description: schemaTemplate.description,
		addedBy: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

jobSchema.index({ department: 1 });

jobSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const JobCircular = mongoose.model('JobCircular', jobSchema);

module.exports = JobCircular;
