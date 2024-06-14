const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Enable CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://devblock--7r11e-bmyqxb-mg-h--tzm0udp.alt.airtableblocks.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

app.post('/send-emails', async (req, res) => {
    const { accessToken, emails, subject, message } = req.body;
    console.log("accessToken, emails, subject, message : ", accessToken, emails, subject, message);

    try {
        const oauth2Client = new OAuth2();
        oauth2Client.setCredentials({
            access_token: accessToken
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        await Promise.all(emails.map(async ({ email, firstName, lastName }) => {
            const personalizedMessage = message.replace('{firstName}', firstName).replace('{lastName}', lastName);
            const emailContent = `To: ${email}\r\nSubject: ${subject}\r\n\r\n${personalizedMessage}`;

            console.log("personalizedMessage : ", personalizedMessage, "emailContent : ", emailContent);

            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
                },
            });

            console.log("Email Response:", response.data);
        }));

        res.status(200).send('Emails sent successfully');
    } catch (error) {
        console.error("Error sending emails:", error);
        res.status(500).send('Error sending emails');
    }
});


const createEmail = (to, subject, message, firstName, lastName) => {
    const personalizedMessage = message.replace('{{firstName}}', firstName).replace('{{lastName}}', lastName);
    const email = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        personalizedMessage
    ].join('\n');

    return email;
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
