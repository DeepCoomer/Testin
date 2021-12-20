import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';

dotenv.config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URL,
    options: { useUnifiedTopology: true, useNewUrlParser: true },
    file: (request, file) => {
        const match = ["image/png", "image/jpg", "file/pdf"];

        if (match.indexOf(file.memeType) === -1)
            return `${Date.now()}-picdrop-${file.originalname}`;

        return {
            bucketName: "photos",
            filename: `${Date.now()}-picdrop-${file.originalname}`
        }
    }
});

export default multer({ storage });