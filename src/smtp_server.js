'use strict';

const SERVER_PORT = parseInt(process.env.SMTP_PORT) || 5870;
const SERVER_HOST = false;

const http = require(process.env.HTTP_LIBRARY)
const querystring = require('querystring');

const SMTPServer = require('smtp-server').SMTPServer

const server = new SMTPServer({
    logger: true,

    size: 10 * 1024 * 1024,

    disabledCommands: ['AUTH', 'STARTTLS'],

    authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],

    onAuth(auth, session, callback) {
        return callback(null, {});
    },

    onData(stream, session, callback) {
        let message = '';
        stream.on('data', (chunk) => {
            message += chunk
        })
        stream.on('end', () => {
            const envelope = session.envelope
            const body = querystring.stringify({
                to: envelope.rcptTo[0].address,
                toname: 'Test data',
                subject: '',
                text: message,
                from: envelope.mailFrom.address
            })

            const options = {
                hostname: process.env.HTTP_HOST || 'localhost',
                port: parseInt(process.env.HTTP_PORT) || 3000,
                protocol: 'https:',
                path: '/api/mail.send.json',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Content-Length': body.length
                }
            }

            var req = http.request(options, (res) => {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);

                res.on('data', (d) => {
                    process.stdout.write(d);
                });
            });

            req.on('error', (e) => {
                console.error(e);
            });

            req.write(body);
            req.end();

            callback(null, 'Message queued')
        })
    }
});

server.on('error', err => {
    console.log('Error occurred');
    console.log(err);
});

// start listening
server.listen(SERVER_PORT, SERVER_HOST);
