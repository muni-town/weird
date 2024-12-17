import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

export const emailer = nodemailer.createTransport(
	{
		url: env.SMTP_URL
	},
	{ from: env.SMTP_FROM }
);
