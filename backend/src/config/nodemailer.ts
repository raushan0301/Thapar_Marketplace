import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Fix for Render/Cloud: Force Node to prefer IPv4 first
// This prevents ENETUNREACH errors when the environment attempts IPv6 connection to Gmail
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (e) {
    console.warn('Could not set default result order to ipv4first');
}

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
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
