

const { simpleParser } = require('mailparser');

const previewEmail = require('./src/index.js');

const fs = require("fs")

f = fs.createReadStream("./test/a.eml")

simpleParser(f, {},(err, parsed) => {
    console.log(parsed)
    console.log(parsed.attachments)
    previewEmail(parsed,{open:false})
        .then(console.log)
        .catch(console.error);

})

