

const { simpleParser } = require('mailparser');

const previewEmail = require('./src/index.js');

const fs = require("fs")

const f = fs.createReadStream("./test/b.eml")

simpleParser(f, {},(err, parsed) => {
    console.log(parsed)
    console.log(parsed.attachments)
    previewEmail(parsed,{open:false,dir:"./aaa"})
        .then(console.log)
        .catch(console.error);

})

