import React, { useState, useRef } from 'react';
import NextImage from 'next/image';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    images: File[];
    setImages: (images: File[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
    existingCount?: number; // Number of existing images (for edit mode)
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    images,
    setImages,
    maxImages = 6,
    maxSizeMB = 5,
    existingCount = 0,
}) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addImages(files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        addImages(files);
    };

    const addImages = (files: File[]) => {
        // Filter only images
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.error('Please select only image files');
            return;
        }

        // Check if adding these would exceed max (including existing images)
        const totalAfterAdd = existingCount + images.length + imageFiles.length;
        if (totalAfterAdd > maxImages) {
            const remaining = maxImages - existingCount - images.length;
            if (remaining === 0) {
                toast.error(`Maximum ${maxImages} images already added. Please remove some images to add new ones.`);
            } else {
                toast.error(`You can only add ${remaining} more image${remaining !== 1 ? 's' : ''}. You have ${existingCount} existing + ${images.length} new = ${existingCount + images.length} total.`);
            }
            return;
        }

        // Check file sizes
        const oversizedFiles = imageFiles.filter(
            (file) => file.size > maxSizeMB * 1024 * 1024
        );
        if (oversizedFiles.length > 0) {
            toast.error(`Each image must be less than ${maxSizeMB}MB`);
            return;
        }

        // Add to images array
        const newImages = [...images, ...imageFiles];
        setImages(newImages);

        // Create previews
        const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        // Revoke the object URL to free memory
        URL.revokeObjectURL(previews[index]);

        setImages(newImages);
        setPreviews(newPreviews);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Max {maxImages})
                <span className="text-red-500 ml-1">*</span>
            </label>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 mb-2">
                    <span className="text-blue-600 font-medium">Click to upload</span> or drag and
                    drop
                </p>
                <p className="text-sm text-gray-500">
                    PNG, JPG, GIF up to {maxSizeMB}MB each
                </p>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group w-full h-32">
                            <NextImage
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover rounded-lg"
                                sizes="300px"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>

                        </div>
                    ))}

                    {/* Add More Button */}
                    {existingCount + images.length < maxImages && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
                        >
                            <ImageIcon className="text-gray-400 mb-2" size={32} />
                            <span className="text-sm text-gray-600">Add More</span>
                        </button>
                    )}
                </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
                {existingCount > 0
                    ? `${existingCount + images.length} of ${maxImages} images total (${existingCount} existing + ${images.length} new).`
                    : `${images.length} of ${maxImages} images selected. First image will be the cover.`
                }
            </p>
        </div>
    );
};
