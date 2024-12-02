
const AWS = require('aws-sdk');
const config = require('../config.json');

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    sessionToken: config.AWS_SESSION_TOKEN,
    region: config.AWS_REGION
});


const s3 = new AWS.S3();
const bucketName = config.S3_BUCKET_NAME;

const S3Service = {
    listFiles: async () => {
        const params = {
            Bucket: bucketName,
        };
        const data = await s3.listObjectsV2(params).promise();


        const files = await Promise.all(
            data.Contents.map(async (item) => {
                const metadata = await s3.headObject({ Bucket: bucketName, Key: item.Key }).promise();
                return {
                    name: item.Key,
                    type: metadata.ContentType || "unknown", // Get content type if available
                    size: item.Size,
                    user: metadata.Metadata.user || "unknown" // Retrieve user metadata
                };
            })
        );

        files.sort((a, b) => a.name.localeCompare(b.name));
        return files;
    },
    uploadFile: async (file, user) => {
        const params = {
            Bucket: bucketName,
            Key: file.name,
            Body: file.content,
            Metadata: {
                user: user // Replace "your-username" with the actual user value
            }
        };
        return s3.upload(params).promise();
    },
    deleteFile: async (fileName) => {
        const params = {
            Bucket: bucketName,
            Key: fileName
        };
        return s3.deleteObject(params).promise();
    }
};

module.exports = S3Service;
