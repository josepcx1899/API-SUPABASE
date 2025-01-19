const express = require('express');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many requests, please try again later.'
    }
});

app.use(limiter);

async function encryptPassword(password) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

async function verifyPassword(hashedPassword, plainPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

async function logActivity(email, time, table, varName) {
    try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ip = ipResponse.data.ip;

        const proxyResponse = await axios.get(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`);
        const proxyData = proxyResponse.data[ip];

        const proxy = proxyData && proxyData.proxy === 'yes' ? 'True' : 'False';

        const data = {
            email,
            ip,
            [varName]: time,
            proxy
        };

        await supabase.from(table).insert(data);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return password.length >= 6 && password.length <= 20;
}

app.post('/register', async (req, res) => {
    const date = moment().format('YYYY-MM-DD HH:mm:ss');
    const { Email, Password, ConfirmPassword } = req.body;

    if (!Email || !Password || !ConfirmPassword) {
        return res.status(400).json({ error: 'Email, password and confirm password are required' });
    }

    if (!isValidPassword(Password) || !isValidPassword(ConfirmPassword)) {
        return res.status(400).json({ error: 'Password must be between 8 and 20 characters' });
    }
    
    if (!isValidEmail(Email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (Password !== ConfirmPassword) {
        return res.status(400).json({ error: 'Password and confirm password must match' });
    }

    try {
        const { data } = await supabase
            .from('Contas')
            .select('email')
            .eq('email', Email)
            .single();

        if (data) {
            return res.status(400).json({ fail: 'Account already exists' });
        }

        const hashedPassword = await encryptPassword(Password);

        const dataToInsert = {
            email: Email,
            password: hashedPassword,
            created_at: date,
            last_login: null
        };

        await supabase.from('Contas').insert(dataToInsert);
        await logActivity(Email, date, 'logs_register', 'created_at');

        return res.status(200).json({ success: 'Account created' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/login', async (req, res) => {
    const lastLoginTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidPassword(Password)) {
        return res.status(400).json({ error: 'Password must be between 8 and 20 characters' });
    }

    if (!isValidEmail(Email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const { data, error } = await supabase
            .from('Contas')
            .select('email, password')
            .eq('email', Email)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await verifyPassword(data.password, Password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        await supabase.from('Contas').update({ last_login: lastLoginTime }).eq('email', Email);
        await logActivity(Email, lastLoginTime, 'logs_login', 'login_at');

        return res.status(200).json({ success: 'Login successful' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

function generateResetCode() {
    return crypto.randomBytes(4).toString('hex');
}

async function sendResetEmail(Email, Code) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: Email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${Code}. It will expire in 15 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw new Error('Failed to send reset email');
    }
}

app.post('/forgot-password', async (req, res) => {
    const { Email } = req.body;

    if (!Email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const expirationTime = moment().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const Code = generateResetCode();

    try {
        await supabase.from('ChangePassword').delete().eq('email', Email);

        const { data, error } = await supabase
            .from('Contas')
            .select('email')
            .eq('email', Email)
            .single();

        if (error || !data) {
            return res.status(200).json({ sucess: 'If the account exists, the code has been sent to your email.' });
        }

        await supabase.from('ChangePassword').insert({
            code: Code,
            email: Email,
            time: expirationTime
        });

        await sendResetEmail(Email, Code);

        return res.status(200).json({ success: 'If the account exists, the code has been sent to your email.'});
    } catch (error) {
        console.error('Error in forgot-password:', error);
        return res.status(500).json({ error: 'an error occurred' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { Email, Code, NewPassword } = req.body;

    if (!Email || !Code || !NewPassword) {
        return res.status(400).json({ error: 'Email, code, and newpassword are required' });
    }

    if (!isValidPassword(NewPassword)) {
        return res.status(400).json({ error: 'Password must be between 8 and 20 characters' });
    }

    try {
        const { data, error } = await supabase
            .from('ChangePassword')
            .select('time')
            .eq('email', Email)
            .eq('code', Code)
            .single();

        if (error || !data) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

        if (currentTime > data.time) {
            return res.status(400).json({ error: 'Code has expired' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(NewPassword, salt);

        await supabase
            .from('Contas')
            .update({ password: hashedPassword })
            .eq('email', Email);

        await supabase
            .from('ChangePassword')
            .delete()
            .eq('email', Email)
            .eq('code', Code);

        return res.status(200).json({ success: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in reset-password:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

app.delete('/delete-account', async (req, res) => {
    const { Email, Password, ConfirmPassword } = req.body;

    if (!Email || !Password || !ConfirmPassword) {
        return res.status(400).json({ error: 'Email, password and confirm password are required' });
    }

    if (!isValidPassword(Password) || !isValidPassword(ConfirmPassword)) {
        return res.status(400).json({ error: 'Password must be between 8 and 20 characters' });
    }

    if (Password !== ConfirmPassword) {
        return res.status(400).json({ error: 'Password and confirm password must match' });
    }

    if (!isValidEmail(Email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const { data, error } = await supabase
            .from('Contas')
            .select('email, password')
            .eq('email', Email)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const passwordMatch = await verifyPassword(data.password, Password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        await supabase.from('Contas').delete().eq('email', Email);
        await supabase.from('ChangePassword').delete().eq('email', Email);

        return res.status(200).json({ success: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'An error occurred while deleting account' });
    }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`API WORKING`);
});
