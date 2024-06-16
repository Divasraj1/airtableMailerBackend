// const express = require('express');
// const bodyParser = require('body-parser');
// const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;
// require('dotenv').config();

// const app = express();
// app.use(bodyParser.json());

// // Enable CORS middleware
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://devblock--7r11e-bmyqxb-mg-h--tzm0udp.alt.airtableblocks.com');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });

// const oauth2Client = new OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     process.env.REDIRECT_URI
// );

// app.post('/send-emails', async (req, res) => {
//     const { accessToken, emails, subject, message } = req.body;
//     console.log("accessToken, emails, subject, message : ", accessToken, emails, subject, message);

//     try {
//         const oauth2Client = new OAuth2();
//         oauth2Client.setCredentials({
//             access_token: accessToken
//         });

//         const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

//         await Promise.all(emails.map(async ({ email, firstName, lastName }) => {
//             const personalizedMessage = message.replace('{firstName}', firstName).replace('{lastName}', lastName);
//             const emailContent = `To: ${email}\r\nSubject: ${subject}\r\n\r\n${personalizedMessage}`;

//             console.log("personalizedMessage : ", personalizedMessage, "emailContent : ", emailContent);

//             const response = await gmail.users.messages.send({
//                 userId: 'me',
//                 requestBody: {
//                     raw: Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
//                 },
//             });

//             console.log("Email Response:", response.data);
//         }));

//         res.status(200).send('Emails sent successfully');
//     } catch (error) {
//         console.error("Error sending emails:", error);
//         res.status(500).send('Error sending emails');
//     }
// });


// const createEmail = (to, subject, message, firstName, lastName) => {
//     const personalizedMessage = message.replace('{{firstName}}', firstName).replace('{{lastName}}', lastName);
//     const email = [
//         `To: ${to}`,
//         'Content-Type: text/html; charset=utf-8',
//         'MIME-Version: 1.0',
//         `Subject: ${subject}`,
//         '',
//         personalizedMessage
//     ].join('\n');

//     return email;
// };

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const session = require('express-session');

const app = express();
// Configure CORS
const allowedOrigins = ['https://devblock--7r11e-bmyqxb-mg-h--tzm0udp.alt.airtableblocks.com'];

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
app.use(session({ secret: 'your-session-secret', resave: false, saveUninitialized: true,cookie: { secure: false } })); // Set cookie to true if using HTTPS

const oauth2Client = new google.auth.OAuth2(); //add google client id, client secret & oauthcallback url

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
    console.log("tokens : ",tokens);
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
    console.log("accesstoken : ",accessToken);
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
            
            console.log("email content is : ",emailContent);
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

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
