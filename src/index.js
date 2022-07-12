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
  //options.dir = path.resolve(options.dir) 

  console.log(options)
  console.log("dir " + options.dir)
  debug('message', message, 'options', options);

  if (typeof message !== 'object')
    throw new Error('Message argument is required');

  //const response = await transport.sendMail(message);

  //const parsed = await simpleParser(response.message);
  //const parsed = await simpleParser(message);
  const parsed = message 
  console.log("fisrt time parsed")
  console.log(parsed)

  //console.log(response.message)
  //console.log(parsed.attachments)
  for(let i = 0 ; i < parsed.attachments.length ; i ++) {
    console.log(parsed.attachments[i].contentType)
    if (parsed.attachments[i].contentType == "message/rfc822") {
      console.log(parsed.attachments[i])
      const msg = await simpleParser(parsed.attachments[i].content)
      const link = await previewEmail(msg,{
        open:false,
        dir: options.dir 
      } )
      
      console.log("dir = " + options.dir)
      console.log("link = " + link)
      let contentLink = link.toString().slice(7 + options.dir.length)
      if (contentLink.startsWith("/")) {
        contentLink = contentLink.slice(1)
      }
      console.log("content link = " + contentLink)
      parsed.attachments[i].content = contentLink
    }
    //console.log(parsed.attachments[i].contentType)
  }
  console.log("MMMM")
  console.log(parsed)
  const html = await renderFilePromise(
    options.template,
    Object.assign(parsed, {
      hello: () => {
        console.log("AAAA")
        return "world"
      },
      cache: true,
      pretty: true,
      dayjs
    })
  );

  const filePath = `${options.dir}/${options.id}.html`;
  debug('filePath', filePath);
  await writeFile(filePath, html);
  console.log(filePath)
  console.log("QQQQQ")
  const url = options.urlTransform(filePath);
  if (options.open) await open(url, options.open);
  return url;
};

module.exports = previewEmail;
