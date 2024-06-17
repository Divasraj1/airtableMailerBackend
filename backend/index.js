require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const session = require('express-session');

const app = express();
// Configure CORS
const allowedOrigins = [process.env.CORS_ALLOWED_ORIGINS];

app.use(cors({
    origin: function (origin, callback) {
        // Check if the incoming origin is allowed
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true,cookie: { secure: false } })); // Set cookie to true if using HTTPS

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.OAUTH_CALLBACK_URL
);

app.get('/auth/google', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/gmail.send'];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    res.send(`Authorization successful!<h3> Copy and Paste this AccessToken in the extension accesstoken field : ${req.session.tokens.access_token} </h3> You can close this window.`);
});

app.get('/logout', (req, res) => {
    console.log("logging out");
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.status(200).send('Logged out successfully');
    });
});


app.post('/send-emails', async (req, res) => {
    const { accessToken, emails, subject, message } = req.body;
    oauth2Client.setCredentials({
        access_token: accessToken,
    });

    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        await Promise.all(emails.map(async record => {
            let personalizedMessage = message;

            Object.keys(record.fields).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                personalizedMessage = personalizedMessage.replace(regex, record.fields[key] || '');
            });

            const emailContent = `To: ${record.email}\r\nSubject: ${subject}\r\n\r\n${personalizedMessage}`;
            
            const raw = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: raw,
                },
            });
        }));

        res.status(200).json({ success: true, message: 'Emails sent successfully' });
    } catch (error) {
        console.log("error is : ",error.message);
        res.json({ success: false, message: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log('Server started on PORT : ',process.env.PORT);
});
