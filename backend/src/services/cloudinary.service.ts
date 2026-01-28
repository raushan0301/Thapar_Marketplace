import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadImage = async (
    fileBuffer: Buffer,
    folder: string = 'thaparmarket'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 1200, height: 1200, crop: 'limit' },
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result!.secure_url);
                }
            }
        );

        const readableStream = Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
    });
};

export const uploadMultipleImages = async (
    files: Express.Multer.File[],
    folder: string = 'thaparmarket'
): Promise<string[]> => {
    const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
    return Promise.all(uploadPromises);
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];

        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted image: ${publicId}`);
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        throw new Error('Failed to delete image');
    }
};

export const deleteMultipleImages = async (imageUrls: string[]): Promise<void> => {
    const deletePromises = imageUrls.map((url) => deleteImage(url));
    await Promise.all(deletePromises);
};
