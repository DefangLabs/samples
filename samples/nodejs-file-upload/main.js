const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('uploads'));

app.get('/', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan files!');
        }
        let fileList = files.map(file => `<li><a href="/${file}">${file}</a></li>`).join('');
        res.send(`
            <h1>File Upload</h1>
            <form ref='uploadForm' 
                id='uploadForm' 
                action='/' 
                method='post' 
                encType="multipart/form-data">
                <input type="file" name="file" />
                <input type='submit' value='Upload!' />
            </form>
            <h2>Uploaded Files</h2>
            <ul>${fileList}</ul>
        `);
    });
});

app.post('/', upload.single('file'), (req, res) => {
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
