const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login.html for /login path
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Temporary in-memory store for OTPs
// Maps email -> { otp, expiresAt, attempts }
const otpStore = new Map();

// Helper to generate a 6-digit numeric OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint: Send OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Check if SMTP configuration is provided
    if (smtpUser && smtpPass && smtpUser.includes('@')) {
        try {
            // Configure SMTP Transporter (defaulting to Gmail settings)
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '465'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            const mailOptions = {
                from: `"Dr. Ayesha Sharma Support" <${smtpUser}>`,
                to: email,
                subject: 'Your Patient Portal Login OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0A1628; text-align: center;">Dr. Ayesha Sharma</h2>
                        <h3 style="color: #C9A84C; text-align: center; border-bottom: 2px solid #C9A84C; padding-bottom: 10px;">Patient Portal Login OTP</h3>
                        <p style="font-size: 16px; color: #333333;">Hello,</p>
                        <p style="font-size: 16px; color: #333333;">You requested a One-Time Password (OTP) to log in to the Patient Portal. Please use the following 6-digit code:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; color: #0A1628; background-color: #F8F9FA; padding: 10px 20px; border-radius: 4px; border: 1px dashed #C9A84C; letter-spacing: 5px;">${otp}</span>
                        </div>
                        <p style="font-size: 14px; color: #666666;">This code is valid for <strong>5 minutes</strong>. For security reasons, do not share this OTP with anyone.</p>
                        <p style="font-size: 14px; color: #666666; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
                            If you did not request this code, please ignore this email or contact support.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            return res.json({ 
                success: true, 
                message: 'OTP has been successfully sent to your email account.',
                mockMode: false 
            });

        } catch (error) {
            console.error('Error sending real email via SMTP:', error);
            // Fallback to mock mode if SMTP failed
            return res.json({ 
                success: true, 
                message: 'Failed to send via SMTP. Operating in local simulation mode.',
                otp: otp, // send back for development
                mockMode: true 
            });
        }
    } else {
        // Fallback simulation mode
        console.log(`\n=========================================`);
        console.log(`[SIMULATOR] OTP for ${email}: ${otp}`);
        console.log(`=========================================\n`);

        return res.json({ 
            success: true, 
            message: 'Operating in local simulation mode (no SMTP configured).',
            otp: otp, // send back for easy testing
            mockMode: true 
        });
    }
});

// Endpoint: Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const emailKey = email.toLowerCase();
    const record = otpStore.get(emailKey);

    if (!record) {
        return res.status(400).json({ success: false, message: 'No OTP requested for this email or OTP expired.' });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(emailKey);
        return res.status(400).json({ success: false, message: 'The OTP has expired. Please request a new one.' });
    }

    record.attempts += 1;
    if (record.attempts > 3) {
        otpStore.delete(emailKey);
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (record.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the code and try again.' });
    }

    // Success! Log the user in and clean up the store
    otpStore.delete(emailKey);

    // Create a dummy user name based on email prefix for custom feel
    const namePrefix = email.split('@')[0];
    const formattedName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);

    return res.json({
        success: true,
        message: 'Successfully authenticated.',
        user: {
            name: formattedName,
            email: emailKey
        }
    });
});

app.listen(PORT, () => {
    console.log(`Dr. Sharma's Website Server running at http://localhost:${PORT}`);
});
