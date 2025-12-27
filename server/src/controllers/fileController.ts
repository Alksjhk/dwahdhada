import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 配置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 允许的图片类型
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // 允许的文件类型
    const allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ];

    const isImage = allowedImageTypes.includes(file.mimetype);
    const isFile = allowedFileTypes.includes(file.mimetype);

    if (isImage || isFile) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'));
    }
};

// 配置multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
    }
});

export class FileController {
    // 上传文件中间件
    uploadFile = upload.single('file');

    // 处理文件上传
    async handleUpload(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '没有上传文件'
                });
            }

            const file = req.file;
            const fileUrl = `/uploads/${file.filename}`;
            
            // 判断文件类型
            const isImage = file.mimetype.startsWith('image/');
            const messageType = isImage ? 'image' : 'file';

            res.json({
                success: true,
                data: {
                    fileName: file.originalname,
                    fileSize: file.size,
                    fileUrl,
                    messageType,
                    mimeType: file.mimetype
                }
            });
        } catch (error) {
            console.error('文件上传失败:', error);
            res.status(500).json({
                success: false,
                message: '文件上传失败'
            });
        }
    }

    // 获取文件
    async getFile(req: Request, res: Response) {
        try {
            const filename = req.params.filename;
            const filePath = path.join(__dirname, '../../uploads', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            res.sendFile(filePath);
        } catch (error) {
            console.error('获取文件失败:', error);
            res.status(500).json({
                success: false,
                message: '获取文件失败'
            });
        }
    }
}