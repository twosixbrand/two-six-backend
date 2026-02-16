import { PrismaClient } from '@prisma/client';
import { S3Client, HeadObjectCommand, PutObjectAclCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const prisma = new PrismaClient();

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
    forcePathStyle: false,
});

async function main() {
    console.log('Starting Image URL Fix...');
    const images = await prisma.imageClothing.findMany(); // Fix all images?
    console.log(`Found ${images.length} images.`);

    for (const img of images) {
        if (!img.image_url) continue;

        try {
            const url = new URL(img.image_url);
            // key is path without leading slash
            const currentKey = url.pathname.substring(1);

            // If it already has DLLO, just fix ACL
            if (currentKey.startsWith('DLLO/')) {
                console.log(`Checking ACL for valid key: ${currentKey}`);
                await s3Client.send(new PutObjectAclCommand({
                    Bucket: bucketName,
                    Key: currentKey,
                    ACL: 'public-read',
                }));
                continue;
            }

            // If not, check if DLLO version exists
            const fixedKey = `DLLO/${currentKey}`;

            try {
                // Check if exists
                await s3Client.send(new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: fixedKey
                }));

                // If we get here, it exists. Fix ACL first.
                await s3Client.send(new PutObjectAclCommand({
                    Bucket: bucketName,
                    Key: fixedKey,
                    ACL: 'public-read',
                }));

                // Update DB
                // host should remain same? 
                // DB URL: https://bucket.endpoint/key
                // New URL: https://bucket.endpoint/fixedKey
                const newUrl = `${url.protocol}//${url.host}/${fixedKey}`;

                await prisma.imageClothing.update({
                    where: { id_image_clothing: img.id_image_clothing },
                    data: { image_url: newUrl }
                });

                console.log(`FIXED: ${img.id_image_clothing} -> ${newUrl}`);

            } catch (headErr: any) {
                // If NotFound, maybe try PROD?
                // console.log(`Not found at ${fixedKey}`);
            }

        } catch (e) {
            console.error(`Failed during processing image ${img.id_image_clothing}:`, e);
        }
    }
    console.log('Done.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
