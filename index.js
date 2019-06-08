const express = require('express');
const PORT = process.env.PORT || 5000
const fileUpload = require('express-fileupload');
const csv = require('csv-parser');
const fs = require('fs');
const hepburn = require("hepburn");
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const csvStringifier = createCsvStringifier({
  header: [
    {id: 'kana', title: 'KANA'},
    {id: 'roma', title: 'ROMANJI'}
  ]
});
let records = [];

// Api
const app = express();
app.use(express.static(__dirname + '/public'));

app.use(fileUpload());

app.post('/results', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.uploadedFile;
  let csvFile = uploadedFile.name

  uploadedFile.mv(csvFile, function(err) {
    if (err)
      return res.status(500).send(err);

    fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      records.push({kana: row.NAME, roma: hepburn.fromKana(row.NAME)});
    })
    .on('end', () => {
      fs.unlink(csvFile, function (err) {
        if (err) throw err;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvStringifier.stringifyRecords(records));
      records = [];
    });
  });
});

app.get('/', function(req, res) {
  res.render('home.ejs');
})
.use(function(req, res, next){
  res.setHeader('Content-Type', 'text/plain');
  res.status(404).send('Page introuvable !');
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

module.exports = app;
