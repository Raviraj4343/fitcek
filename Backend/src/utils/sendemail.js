import nodemailer from "nodemailer";

// Ensure `fetch` is available in Node (Node 18+ has global fetch). If not, try to polyfill.
if (typeof fetch === 'undefined') {
  try {
    const mod = await import('node-fetch');
    // node-fetch v3 exports default as the fetch function
    global.fetch = mod.default || mod;
  } catch (e) {
    // leave it undefined; we'll surface a clear error later if HTTP fallback is needed
    console.warn('node global fetch not available and node-fetch could not be imported:', e && e.message);
  }
}

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

const brevoClient = async () => {
  if (!process.env.BREVO_API_KEY) return null;
  try {
    const mod = await import('@getbrevo/brevo');
    const Brevo = mod.default || mod;
    return new Brevo({ apiKey: process.env.BREVO_API_KEY });
  } catch (e) {
    // SDK not installed — we'll fall back to HTTP API using fetch
    console.warn('Brevo SDK not available, will use HTTP API fallback:', e && e.message);
    return null;
  }
};

const sendViaBrevoHttp = async (sendSmtpEmail) => {
  // Use Brevo HTTP API as fallback when SDK isn't installed
  const url = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  try {
    const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(sendSmtpEmail),
    });

    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      const err = new Error(`Brevo HTTP API error: ${res.status} ${res.statusText} ${text || ''}`);
      err.status = res.status;
      throw err;
    }

    return res.json();
  } catch (e) {
    // enrich error for caller
    const err = new Error(`Brevo HTTP send failed: ${e && e.message}`);
    err.original = e;
    throw err;
  }
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

  const brevo = await brevoClient();
  const sendSmtpEmail = {
    sender: { name: "Health Tracker", email: process.env.SENDER_EMAIL },
    to: [{ email, name }],
    subject: "✅ Verify Your Email – Health Tracker",
    htmlContent: htmlContent,
  };

  if (brevo) {
    try {
      const tranEmailApi = new brevo.TransactionalEmailsApi();
      const response = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
      return response;
    } catch (e) {
      console.warn('Brevo SDK send failed, falling back to HTTP API:', e && e.message);
      // try HTTP API fallback
      return await sendViaBrevoHttp(sendSmtpEmail);
    }
  }

  // If SDK not available but API key present, use HTTP API directly
  if (process.env.BREVO_API_KEY) {
    return await sendViaBrevoHttp(sendSmtpEmail);
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

  const sendSmtpEmail = {
    sender: { name: "Health Tracker", email: process.env.SENDER_EMAIL },
    to: [{ email, name }],
    subject: "🔑 Reset Your Password – Health Tracker",
    htmlContent: htmlContent,
  };

  const brevo = await brevoClient();
  if (brevo) {
    try {
      const tranEmailApi = new brevo.TransactionalEmailsApi();
      const response = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
      return response;
    } catch (e) {
      console.warn('Brevo SDK send failed, falling back to HTTP API:', e && e.message);
      return await sendViaBrevoHttp(sendSmtpEmail);
    }
  }

  if (process.env.BREVO_API_KEY) {
    return await sendViaBrevoHttp(sendSmtpEmail);
  }

  // Fall back to SMTP transporter
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials missing and Brevo not available — cannot send email');
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