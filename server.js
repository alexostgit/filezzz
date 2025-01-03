const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const S3Service = require('./services/S3Service');
const TickerService = require('./services/TickerService');
const TickerServiceChat = require('./services/TickerServiceChat');
const AWS = require('aws-sdk');
const config = require('./config.json');
const session = require('express-session');
const path = require('path');
const { log } = require('console');

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    sessionToken: config.AWS_SESSION_TOKEN,
    region: config.AWS_REGION,
});

const s3 = new AWS.S3();
require('dotenv').config();
const upload = multer();
const app = express();
app.use(bodyParser.json());
app.use(express.json()); // For parsing application/json

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // 'views' directory
app.use(express.static(path.join(__dirname, 'public')));




// Set up sessions
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
}));
// Middleware to provide username in the session
app.use((req, res, next) => {
    if (!req.session.username) {
        req.session.username = null; // Initialize username in session as null
    }
    next();
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
    const fileName = req.query.fileName;
    const user = req.query.user || 'Downloader anonymous'; // Get the user from the request body, default to 'anonymous'

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
        await TickerService.logChange(`${fileName}`, 'downloaded', user);

    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).send('Error downloading file.');
    }
});

// Route for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const user = req.body.user || 'Uploader anonymous'; // Get the user from the request body, default to 'anonymous'
    console.log(user);
    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    try {
        const result = await S3Service.uploadFile({
            name: file.originalname,
            content: file.buffer,
        }, user);
        await TickerService.logChange(`${file.originalname}`, 'uploaded', user);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
// Route for uploading files
app.post('/send', upload.none(), async (req, res) => {
    const chatmessage = req.body.message;
    const user = req.body.user || 'Anonymous'; // Get the user from the request body, default to 'anonymous'

    if (!chatmessage) {
        console.log(chatmessage);

        return res.status(400).send(chatmessage);
    }

    try {
        await TickerServiceChat.chatChange(`${chatmessage}`, user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route for deleting files
app.delete('/delete', async (req, res) => {
    const fileName = req.query.fileName;
    const user = req.query.user || 'deleter anonymous'; // Get the user from the request body, default to 'anonymous'
    if (!fileName) {
        return res.status(400).send('File name is required.');
    }

    try {
        await S3Service.deleteFile(fileName);
        await TickerService.logChange(`${fileName}`, 'deleted', user); // Log the deletion
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

// Route for fetching ticker data
app.get('/chatticker', async (req, res) => {
    try {
        const chats = await TickerServiceChat.getChats();
        res.status(200).json(chats); // Publicly accessible
    } catch (error) {
        res.status(500).send(error.message);
    }
});




app.post('/set-username', (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === "") {
        return res.status(400).send("Username is required.");
    }

    req.session.username = username.trim(); // Save the username in the session
    console.log("Set Username:", req.session.username); // Debugging
    res.status(200).send("Username set successfully.");
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Failed to destroy session:", err);
            return res.status(500).send("Failed to log out.");
        }
        console.log("User logged out successfully"); // Debugging

        res.status(200).send("Logged out successfully.");
    });
});

app.get('/', (req, res) => {
    const username = req.session.username; // Use session username or fallback
    res.render('index', { username });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



