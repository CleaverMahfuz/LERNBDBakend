const pug = require('pug');
const { htmlToText } = require('html-to-text');
const nodemailer = require('nodemailer');

module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.fullName = user.fullName;
		this.url = url;
		this.from = `ELearnBD Authorization <${process.env.EMAIL_FROM}>`;
	}

	async send(template, subject) {
		const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
			fullName: this.fullName,
			url: this.url,
			subject,
		});

		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			html,
			text: htmlToText(html),
		};

		let mailConfig = {};

		if (process.env.NODE_ENV === 'production') {
			mailConfig = {
				service: 'SendGrid',
				auth: {
					user: process.env.SENDGRID_USERNAME,
					pass: process.env.SENDGRID_PASSWORD,
				},
			};
		} else {
			mailConfig = {
				host: process.env.MAILTRAP_HOST,
				port: process.env.MAIL_PORT,
				auth: {
					user: process.env.MAILTRAP_USERNAME,
					pass: process.env.MAILTRAP_PASSWORD,
				},
			};
		}

		await nodemailer.createTransport(mailConfig).sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to the ELearnBD Family');
	}

	async sendPasswordReset() {
		await this.send('passwordReset', 'ELearnBD password reset token (valid for 5 minutes)');
	}
};
