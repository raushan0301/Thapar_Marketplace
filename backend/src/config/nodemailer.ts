import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    connectionTimeout: 10000, // 10 seconds timeout
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Force IPv4 to prevent ENETUNREACH errors on specific cloud providers (like Render)
    // that might try IPv6 and fail
    family: 4,
} as any);

export default transporter;
