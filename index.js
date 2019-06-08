// Express JS.
const express = require('express');

// Heroku Port.
const PORT = process.env.PORT || 5000

// Express fileupload.
const fileUpload = require('express-fileupload');

// CSV parser.
const csv = require('csv-parser');

// File.
const fs = require('fs');

// Hepburn.
const hepburn = require("hepburn");

// CSV writer.
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

// CSV structure.
const csvStringifier = createCsvStringifier({
  header: [
    {id: 'kana', title: 'KANA'},
    {id: 'roma', title: 'ROMANJI'}
  ]
});

// Init results variable.
let records = [];

// Api
const app = express();

// Public folder.
app.use(express.static(__dirname + '/public'));

// File upload call.
app.use(fileUpload());

// Homepage.
app.get('/', function(req, res) {
  res.render('home.ejs');
})
// CSV download.
.post('/results', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // Get uploaded CSV file.
  let uploadedFile = req.files.uploadedFile;

  // Make it a variable.
  let csvFile = uploadedFile.name

  // Move CSV file.
  uploadedFile.mv(csvFile, function(err) {
    if (err)
      return res.status(500).send(err);

    // Parse CSV file.
    fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      // Push data to array records.
      records.push({kana: row.NAME, roma: hepburn.fromKana(row.NAME)});
    })
    .on('end', () => {
      // Remove CSV File.
      fs.unlink(csvFile, function (err) {
        if (err) throw err;
      });
      // Set Page header.
      res.setHeader('Content-Type', 'text/csv');
      // Set CSV content.
      res.send(csvStringifier.stringifyRecords(records));
      // Reinit results variable.
      records = [];
    });
  });
})
// 404.
.use(function(req, res, next){
  res.setHeader('Content-Type', 'text/plain');
  res.status(404).send('Page introuvable !');
});

// Heroku listen (Must be commented on local environment).
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

module.exports = app;
