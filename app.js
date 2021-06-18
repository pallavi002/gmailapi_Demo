const express = require("express");
const app = express();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var MailParser = require("mailparser").MailParser;
const cheerio = require('cheerio');
const { query } = require("express");

app.set("view engine", "ejs")
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.labels.list({
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });
        } else {
            console.log('No labels found.');
        }
    });
}

function listMessages(auth, query, stri) {
    query = 'pallavi2808lodhi@gmail.com';
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.messages.list(
            {
                userId: 'me',
                q: query,
                maxResults: 5,
                labelIds: 'INBOX'
            }, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!res.data.messages) {
                    resolve([]);
                    return;
                } resolve(res.data);

                getMail(res.data.messages[0].id, auth, stri);
                console.log(stri)
            }
        );
    })
}


function getMail(msgId, auth, stri) {
        console.log(msgId)
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.messages.get({
            userId: 'me',
            id: msgId,
        }, (err, res) => {
            // console.log(res.data.labelIds.INBOX)
            if (!err) {
                // var stri;
                console.log("no error")
                var body = res.data.payload.parts[0].body.data;
                // global.Base64 = {
                //     encode: function (str) {
                //         return Buffer.from(str).toString('base64');
                //     },
                // };
                const buff = Buffer.from(body, "base64");

                stri = buff.toString("utf8");
                console.log(stri);
                return stri;
                // global.gzip = {
                //     zip: function (str) {
                //         return zlib.gzipSync(Buffer.from(str));
                //     },
                // }
            } else {
                console.log("SOME ERROR OCCURRED" + err)
            }

        });
}

app.get("/", (req, res) => {
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content), listMessages);
    });
    res.render("index")
})

app.listen("5000", () => { console.log("app running on port 5000") })