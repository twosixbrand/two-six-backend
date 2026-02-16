import { S3Client, PutObjectAclCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const bucketName = process.env.DO_SPACES_BUCKET || 'two-six';
const rawEndpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
const endpoint = rawEndpoint.replace(`${bucketName}.`, '');

const s3Client = new S3Client({
    endpoint: endpoint,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    },
    forcePathStyle: false, // DO Spaces usually supports virtual-hosted style, but endpoint must be region root
});

async function checkKey(key: string) {
    try {
        console.log(`Checking ${key}...`);
        // Just try to set ACL, if it works, it exists
        await s3Client.send(new PutObjectAclCommand({
            Bucket: bucketName,
            Key: key,
            ACL: 'public-read',
        }));
        console.log(`FOUND and FIXED: ${key}`);
    } catch (error: any) {
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
            console.log(`Missing: ${key}`);
        } else {
            console.error(`Error checking ${key}:`, error.name, error.message);
        }
    }
}

const basePath = 'ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/q4a11-negro.jpeg';
const prefixes = ['', 'DLLO/', 'PROD/', 'DEV/'];

async function run() {
    for (const prefix of prefixes) {
        await checkKey(prefix + basePath);
    }
}

run();
