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

// Robust Transporter Factory
// Resolves Gmail IP to IPv4 manually to bypass IPv6 issues on Render
let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async () => {
    if (transporter) return transporter;

    // Resolve IPv4 for smtp.gmail.com
    let ip = '142.250.101.108'; // Default fallback IP
    try {
        const addresses = await dns.promises.resolve4('smtp.gmail.com');
        if (addresses && addresses.length > 0) {
            ip = addresses[0];
        }
    } catch (e) {
        // DNS resolution failed, using fallback IP
    }

    transporter = nodemailer.createTransport({
        host: ip, // Use resolved IP
        port: 465,
        secure: true,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
            servername: 'smtp.gmail.com',
        },
    } as any);

    return transporter;
};
