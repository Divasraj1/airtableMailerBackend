const express = require('express');
const {google} = require('googleapis');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

const gmail = google.gmail({version: 'v1', auth: oAuth2Client});

app.post('/send-emails', async (req, res) => {
    const {emails, message} = req.body;
    console.log("emails : ",emails, " message : ",message);

    try {
        await Promise.all(emails.map(async ({email, firstName, lastName}) => {
            const personalizedMessage = message.replace('{firstName}', firstName).replace('{lastName}', lastName);
            const emailContent = `To: ${email}\r\nSubject: Your Subject\r\n\r\n${personalizedMessage}`;

            console.log("personalizedMessage : ",personalizedMessage, "emailContent : ",emailContent);
            // await gmail.users.messages.send({
            //     userId: 'me',
            //     requestBody: {
            //         raw: Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
            //     },
            // });
        }));

        res.status(200).send('Emails sent successfully');
    } catch (error) {
        res.status(500).send('Failed to send emails');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
