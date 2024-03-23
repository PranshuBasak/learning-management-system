import path from 'path';
import multer from 'multer';

const upload = multer({
    dest: "./public",
    limits: {fieldSize: 50 * 1024 * 1024},
    storage: multer.diskStorage({
        destination: "./public",
        filename: (_req, file, cb) => {
            cb(null, file.originalname);
        }
    }),
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp' && ext !== '.mp4') {
            cb(new Error(`Upsupported file type! ${ext}`), false);
            return;
        }
        cb(null, true);
    }
})

export default upload;