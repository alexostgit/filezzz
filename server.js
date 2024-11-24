const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const S3Service = require('./services/S3Service');
const TickerService = require('./services/TickerService');
const AWS = require('aws-sdk');
const config = require('./config.json');

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    sessionToken: config.AWS_SESSION_TOKEN,
    region: config.AWS_REGION,
});

const s3 = new AWS.S3();
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const upload = multer();

// Home route for the file upload interface
app.get('/', (req, res) => {
    res.render('index');
});

// Route to list files for download
app.get('/files', async (req, res) => {
    try {
        const files = await S3Service.listFiles();
        res.json(files); // Publicly accessible
    } catch (error) {
        res.status(500).send('Error retrieving files');
    }
});

app.get('/download', async (req, res) => {
    const { fileName } = req.query;

    if (!fileName) {
        return res.status(400).send('File name is required.');
    }

    const params = {
        Bucket: config.S3_BUCKET_NAME,
        Key: fileName,
    };

    try {
        const fileStream = s3.getObject(params).createReadStream();
        res.attachment(fileName); // Set the file to be downloaded
        fileStream.pipe(res); // Pipe the file content to the response
        await TickerService.logChange(`${fileName} downloaded.`);

    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).send('Error downloading file.');
    }
});

// Route for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    try {
        const result = await S3Service.uploadFile({
            name: file.originalname,
            content: file.buffer
        });
        await TickerService.logChange(`${file.originalname} uploaded.`);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route for deleting files
app.delete('/delete', async (req, res) => {
    const fileName = req.query.fileName;
    if (!fileName) {
        return res.status(400).send('File name is required.');
    }

    try {
        await S3Service.deleteFile(fileName);
        await TickerService.logChange(`${fileName} deleted.`); // Log the deletion
        res.status(200).send(`File ${fileName} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).send('Failed to delete file.');
    }
});

// Route for fetching ticker data
app.get('/ticker', async (req, res) => {
    try {
        const logs = await TickerService.getLogs();
        res.status(200).json(logs); // Publicly accessible
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));