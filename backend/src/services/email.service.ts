import resend from '../config/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ThaparMarket <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      throw new Error(error.message);
    }

    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 8px; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Welcome to ThaparMarket!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for registering with ThaparMarket - your campus marketplace!</p>
          <p>Please verify your email address using the OTP below:</p>
          <div class="otp">${token}</div>
          <p>This OTP will expire in 15 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <div class="footer">
            <p>Best regards,<br>SnapLocate Team</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your ThaparMarket Account',
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your ThaparMarket account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <div class="footer">
            <p>Best regards,<br>SnapLocate Team</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your ThaparMarket Password',
    html,
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ThaparMarket!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your email has been verified successfully! You're now part of the ThaparMarket community.</p>
          <p><strong>What you can do:</strong></p>
          <div class="feature">📚 Buy and sell books, electronics, furniture, and more</div>
          <div class="feature">🚲 Rent bikes and equipment from fellow students</div>
          <div class="feature">🔍 Report lost items or help others find theirs</div>
          <div class="feature">💬 Chat directly with buyers and sellers</div>
          <p>Start exploring the marketplace and make your first listing today!</p>
          <div class="footer">
            <p>Happy Trading!<br>SnapLocate Team</p
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to ThaparMarket! 🎉',
    html,
  });
};
