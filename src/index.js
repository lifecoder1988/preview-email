const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

const dayjs = require('dayjs');
const debug = require('debug')('preview-email');
const nodemailer = require('nodemailer');
const open = require('open');
const pug = require('pug');
const uuid = require('uuid');
const { simpleParser } = require('mailparser');

const writeFile = util.promisify(fs.writeFile);

const transport = nodemailer.createTransport({
  streamTransport: true,
  buffer: true
});

const templateFilePath = path.join(__dirname, '..', 'template.pug');

const renderFilePromise = util.promisify(pug.renderFile);

const previewEmail = async (message, options) => {
  options = {
    dir: os.tmpdir(),
    id: uuid.v4(),
    open: { wait: false },
    template: templateFilePath,
    urlTransform: (path) => `file://${path}`,
    ...options
  };
  debug('message', message, 'options', options);

  if (typeof message !== 'object')
    throw new Error('Message argument is required');

  const response = await transport.sendMail(message);

  const parsed = await simpleParser(response.message);

  //console.log(response.message)
  console.log("AAAAA")
  //console.log(parsed.attachments)
  for(let i = 0 ; i < parsed.attachments.length ; i ++) {
    console.log(parsed.attachments[i].contentType)
    if (parsed.attachments[i].contentType == "message/rfc822") {
      console.log(parsed.attachments[i])
      const msg = await simpleParser(parsed.attachments[i].content)

      const link = await previewEmail(msg,{open:false})
      console.log(link)
      parsed.attachments[i].content = link.toString()
    }
    //console.log(parsed.attachments[i].contentType)
  }
  console.log("MMMM")
  console.log(parsed.attachments)
  const html = await renderFilePromise(
    options.template,
    Object.assign(parsed, {
      cache: true,
      pretty: true,
      dayjs
    })
  );

  const filePath = `${options.dir}/${options.id}.html`;
  debug('filePath', filePath);
  await writeFile(filePath, html);

  const url = options.urlTransform(filePath);
  if (options.open) await open(url, options.open);
  return url;
};

module.exports = previewEmail;
