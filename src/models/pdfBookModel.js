const mongoose = require('mongoose');
const { schemaTemplate } = require('./modelFactory');

const pdfSchema = new mongoose.Schema(
	{
		title: schemaTemplate.title,
		driveId: schemaTemplate.driveId,
		authorName: schemaTemplate.authorName,
		subject: schemaTemplate.subject,
		photo: schemaTemplate.photo,
		addedBy: schemaTemplate.addedBy,
		updatedBy: schemaTemplate.updatedBy,
		isActive: schemaTemplate.isActive,
	},
	{
		timestamps: true,
	},
);

pdfSchema.index({ subject: 1 });

pdfSchema.pre(/^find/, function hideInactive(next) {
	this.find({ isActive: { $ne: false } });
	next();
});

const PdfBook = mongoose.model('PdfBook', pdfSchema);

module.exports = PdfBook;
