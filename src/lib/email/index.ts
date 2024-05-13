import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_SECURE.toLowerCase() == 'true',
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS
	}
});
export const mail_from = env.SMTP_FROM;
