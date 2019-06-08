const express = require('express');
const PORT = process.env.PORT || 5000
const fileUpload = require('express-fileupload');
const csv = require('csv-parser');
const fs = require('fs');
const hepburn = require("hepburn");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'romanji.csv',
  header: [
    {id: 'kana', title: 'KANA'},
    {id: 'roma', title: 'ROMANJI'}
  ]
});
const records = [];

// Api
const app = express();
app.use(express.static(__dirname + '/public'));

app.use(fileUpload());

app.post('/upload', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.uploadedFile;

  uploadedFile.mv(uploadedFile.name, function(err) {
    if (err)
      return res.status(500).send(err);

    fs.createReadStream(uploadedFile.name)  
    .pipe(csv())
    .on('data', (row) => {
      records.push({kana: row.NAME, roma: hepburn.fromKana(row.NAME)});
    })
    .on('end', () => {
      fs.unlink('romanji.csv', 
        function(err, data) { 
          if (err) throw err;
        });
      csvWriter.writeRecords(records)
        .then(() => {
          fs.unlink(uploadedFile.name, 
            function(err, data) { 
              if (err) throw err;
            });
        });
    });

    res.download('romanji.csv');
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
