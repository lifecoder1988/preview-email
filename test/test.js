const fs = require('fs');
const path = require('path');

const test = require('ava');
const nodemailer = require('nodemailer');

const previewEmail = require('../src/index.js');

const transport = nodemailer.createTransport({ jsonTransport: true });

test('returns function', (t) => {
  t.true(typeof previewEmail === 'function');
});

test('opens a preview email', async (t) => {
  const message = {
    from: 'niftylettuce <niftylettuce+from@gmail.com>',
    to: 'niftylettuce+to@gmail.com, niftylettuce <niftylettuce+test@gmail.com>',
    subject: 'Hello world',
    html: `<p>Hello world</p>`,
    text: 'Hello world',
    replyTo: 'niftylettuce <niftylettuce+replyto@gmail.com>',
    inReplyTo: 'in reply to',
    attachments: [
      { filename: 'hello-world.txt', content: 'Hello world' },
      { path: path.join(__dirname, '..', '.editorconfig') },
      { path: path.join(__dirname, '..', 'demo.png') },
      {
        filename: 'test.txt',
        content: fs.createReadStream(path.join(__dirname, 'test.txt'))
      },
      {
        filename: 'a.eml',
        content: fs.createReadStream(path.join(__dirname, 'a.eml'))
      }
    ],
    headers: {
      'X-Some-Custom-Header': 'Some Custom Value'
    },
    list: {
      unsubscribe: 'https://niftylettuce.com/unsubscribe'
    }
  };
  const response = await transport.sendMail(message);
  const url = await previewEmail(JSON.parse(response.message));
  t.true(typeof url === 'string');
});

test('does not open', async (t) => {
  const url = await previewEmail({}, { open: false });
  t.true(typeof url === 'string');
});

test('invalid message', async (t) => {
  const error = await t.throwsAsync(previewEmail(false));
  t.is(error.message, 'Message argument is required');
});

test('custom id', async (t) => {
  const id = Date.now().toString();
  const url = await previewEmail({}, { id, open: false });
  t.is(path.basename(url).replace('.html', ''), id);
});

test('does not open in browser', async (t) => {
  const url = await previewEmail({}, { open: false });
  t.true(typeof url === 'string');
});

test('transform URL', async (t) => {
  const url = await previewEmail(
    {},
    {
      open: false,
      urlTransform: (path) => `http://localhost:8000/${path}`
    }
  );
  t.regex(url, /^http:\/\/localhost:8000\//);
});
