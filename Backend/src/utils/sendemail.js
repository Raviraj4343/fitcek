import nodemailer from "nodemailer";
import Brevo from "@getbrevo/brevo";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const brevoClient = () => {
  if (!process.env.BREVO_API_KEY) return null;
  return new Brevo({ apiKey: process.env.BREVO_API_KEY });
};

/**
 * Send email verification email
 */
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const logoUrl = `${process.env.CLIENT_URL || ""}/src/logo/app_logo.png`;

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; background-color: #f6fbfa;">
        <div style="text-align:center;padding:18px 0;">
          <img src="${logoUrl}" alt="AQTEV" style="height:56px;display:inline-block;" />
        </div>
        <div style="background: white; padding: 28px; border-radius: 12px; box-shadow: 0 4px 18px rgba(2,6,23,0.06);">
          <h2 style="color: #042827; margin-top:0">Hi ${name}! 👋</h2>
          <p style="color: #475e63; font-size: 16px;">Thanks for signing up for <strong>AQTEV</strong>. Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${verifyUrl}" 
               style="background: linear-gradient(90deg, #01786f 0%, #06b6d4 100%); 
                      color: white; 
                      padding: 12px 28px; 
                      border-radius: 30px; 
                      text-decoration: none; 
                      font-size: 15px;
                      font-weight: 700;">
              Verify My Email
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in <strong>${process.env.EMAIL_VERIFICATION_EXPIRE_TIME || "24 hours"}</strong>. If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eef2f6; margin: 20px 0;">
          <p style="color: #9aa7a3; font-size: 12px; text-align: center;">AQTEV © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

  const brevo = brevoClient();
  if (brevo) {
    const tranEmailApi = new brevo.TransactionalEmailsApi();
    const sendSmtpEmail = {
      sender: { name: "Health Tracker", email: process.env.SENDER_EMAIL },
      to: [{ email, name }],
      subject: "✅ Verify Your Email – Health Tracker",
      htmlContent: htmlContent,
    };

    const response = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    return response;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"Health Tracker App" <${process.env.SMTP_USER || process.env.SENDER_EMAIL}>`,
    to: email,
    subject: "✅ Verify Your Email – Health Tracker",
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

/**
 * Send password reset email (optional extension)
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const logoUrl = `${process.env.CLIENT_URL || ""}/src/logo/app_logo.png`;
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; background-color: #f6fbfa;">
        <div style="text-align:center;padding:18px 0;">
          <img src="${logoUrl}" alt="AQTEV" style="height:56px;display:inline-block;" />
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 18px rgba(2,6,23,0.06);">
          <h2 style="margin-top:0;color:#042827">Hi ${name},</h2>
          <p style="color:#475e63">You requested a password reset. Click the button below to set a new password.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${resetUrl}" style="background:linear-gradient(90deg,#01786f 0%,#06b6d4 100%);color:white;padding:12px 24px;border-radius:26px;text-decoration:none;font-weight:700;">Reset Password</a>
          </div>
          <p style="color:#94a3b8;font-size:13px">This link expires in 1 hour.</p>
        </div>
      </div>
    `;

  const brevo = brevoClient();
  if (brevo) {
    const tranEmailApi = new brevo.TransactionalEmailsApi();
    const sendSmtpEmail = {
      sender: { name: "Health Tracker", email: process.env.SENDER_EMAIL },
      to: [{ email, name }],
      subject: "🔑 Reset Your Password – Health Tracker",
      htmlContent: htmlContent,
    };

    const response = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    return response;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"Health Tracker App" <${process.env.SMTP_USER || process.env.SENDER_EMAIL}>`,
    to: email,
    subject: "🔑 Reset Your Password – Health Tracker",
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export default { sendVerificationEmail, sendPasswordResetEmail };