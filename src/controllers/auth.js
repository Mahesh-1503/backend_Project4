const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user'
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide an email and password' });
        }

        // Check for user and explicitly select password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('Login Error:', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Forgot Password Request:', { email });

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide an email' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return res.status(404).json({ 
                success: false, 
                message: 'There is no user with that email' 
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();
        console.log('OTP generated for user:', { email, otp });

        // Create email message
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Your OTP is: ${otp}`;

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: 'Password Reset OTP',
                text: message
            });

            console.log('OTP email sent successfully to:', email);
            res.status(200).json({ 
                success: true, 
                message: 'OTP sent to your email' 
            });
        } catch (err) {
            console.error('Email sending error:', err);
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();

            return res.status(500).json({ 
                success: false, 
                message: 'Email could not be sent' 
            });
        }
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(400).json({ 
            success: false, 
            message: err.message || 'Failed to process request' 
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        console.log('Reset Password Request:', { email, otp, passwordLength: password?.length });

        if (!email || !otp || !password) {
            console.log('Missing required fields:', { email: !!email, otp: !!otp, password: !!password });
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP and new password'
            });
        }

        const user = await User.findOne({
            email,
            otp,
            otpExpire: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            console.log('User not found or OTP invalid/expired');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        console.log('Found user:', { userId: user._id, email: user.email });

        // Set new password
        user.password = password;
        user.otp = undefined;
        user.otpExpire = undefined;

        await user.save();
        console.log('Password reset successful for user:', email);

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to reset password'
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}; 