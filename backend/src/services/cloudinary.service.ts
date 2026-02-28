import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadImage = async (
    fileBuffer: Buffer,
    folder: string = 'thaparmarket'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        console.log(`📤 Starting image upload to folder: ${folder}, size: ${(fileBuffer.length / 1024).toFixed(2)}KB`);

        // Set timeout for upload (30 seconds)
        const timeout = setTimeout(() => {
            reject(new Error('Image upload timeout - took longer than 30 seconds'));
        }, 30000);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                asset_folder: folder, // Force visual folder location in Media Library
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 1200, height: 1200, crop: 'limit' },
                ],
                timeout: 60000, // Cloudinary timeout: 60 seconds
            },
            (error, result) => {
                clearTimeout(timeout);

                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {                    resolve(result!.secure_url);
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
    try {
        const uploadPromises = files.map((file, index) => {            return uploadImage(file.buffer, folder);
        });

        const results = await Promise.all(uploadPromises);        return results;
    } catch (error) {
        console.error('❌ Failed to upload images:', error);
        throw error;
    }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];

        await cloudinary.uploader.destroy(publicId);    } catch (error) {
        console.error('❌ Error deleting image:', error);
        throw new Error('Failed to delete image');
    }
};

export const deleteMultipleImages = async (imageUrls: string[]): Promise<void> => {
    const deletePromises = imageUrls.map((url) => deleteImage(url));
    await Promise.all(deletePromises);
};
