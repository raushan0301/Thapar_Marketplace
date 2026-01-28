import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    images: File[];
    setImages: (images: File[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    images,
    setImages,
    maxImages = 6,
    maxSizeMB = 5,
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

        // Check if adding these would exceed max
        if (images.length + imageFiles.length > maxImages) {
            toast.error(`You can only upload up to ${maxImages} images`);
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
                        <div key={index} className="relative group">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
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
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                    Cover
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add More Button */}
                    {images.length < maxImages && (
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
                {images.length} of {maxImages} images selected. First image will be the cover.
            </p>
        </div>
    );
};
