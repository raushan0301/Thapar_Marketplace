'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { listingService } from '@/services/listingService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/listings/ImageUpload';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditListingPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isAuthenticated } = useAuthStore();

    const [listing, setListing] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        condition: '',
        listing_type: 'sell' as 'sell' | 'rent',
        location: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to edit listing');
            router.push('/login');
            return;
        }
        fetchListingAndCategories();
    }, [isAuthenticated, params.id]);

    const fetchListingAndCategories = async () => {
        try {
            setLoading(true);

            // Fetch listing details
            const listingResult = await listingService.getListingById(params.id as string);
            if (!listingResult.success) {
                toast.error('Listing not found');
                router.push('/my-listings');
                return;
            }

            const fetchedListing = listingResult.data.listing;

            // Check ownership
            if (fetchedListing.user_id !== user?.id) {
                toast.error('You can only edit your own listings');
                router.push('/my-listings');
                return;
            }

            setListing(fetchedListing);
            setExistingImages(fetchedListing.images || []);

            // Pre-fill form
            setFormData({
                title: fetchedListing.title || '',
                description: fetchedListing.description || '',
                price: fetchedListing.price?.toString() || '',
                category_id: fetchedListing.category_id?.toString() || '',
                condition: fetchedListing.condition || '',
                listing_type: fetchedListing.listing_type || 'sell',
                location: fetchedListing.location || '',
            });

            // Fetch categories
            const catResult = await listingService.getCategories();
            if (catResult.success) {
                setCategories(catResult.data.categories);
            }
        } catch (error) {

            toast.error('Failed to load listing details');
            router.push('/my-listings');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.category_id) {
            newErrors.category_id = 'Category is required';
        }

        if (!formData.price) {
            newErrors.price = 'Price is required';
        } else if (parseFloat(formData.price) <= 0) {
            newErrors.price = 'Price must be greater than 0';
        }

        if (existingImages.length === 0 && images.length === 0) {
            newErrors.images = 'At least one image is required';
        }

        // Check total image count
        const totalImages = existingImages.length + images.length;
        if (totalImages > 6) {
            newErrors.images = `Too many images. Maximum 6 allowed (you have ${existingImages.length} existing + ${images.length} new = ${totalImages} total)`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await listingService.updateListing(params.id as string, {
                title: formData.title,
                description: formData.description,
                price: formData.price ? parseFloat(formData.price) : undefined,
                category_id: parseInt(formData.category_id),
                condition: formData.condition || undefined,
                listing_type: formData.listing_type,
                location: formData.location || undefined,
                images: images.length > 0 ? images : undefined,
                existing_images: existingImages,
            });

            if (result.success) {
                toast.success('Listing updated successfully!');
                router.push(`/listings/${params.id}`);
            } else {

                toast.error(result.error || 'Failed to update listing');
            }
        } catch (error: any) {


            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
                    <p className="mt-2 text-gray-600">
                        Update your listing details
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    {/* Title */}
                    <Input
                        label="Title"
                        type="text"
                        placeholder="e.g., MacBook Pro 2021 - Excellent Condition"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        error={errors.title}
                        required
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                            placeholder="Describe your item in detail..."
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={5}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            required
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Category & Listing Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, category_id: e.target.value })
                                }
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.category_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Listing Type
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                value={formData.listing_type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        listing_type: e.target.value as any,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                required
                            >
                                <option value="sell">For Sale</option>
                                <option value="rent">For Rent</option>
                            </select>
                        </div>
                    </div>

                    {/* Price & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={`Price ${formData.listing_type === 'rent' ? '(per month)' : ''}`}
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            error={errors.price}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condition
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) =>
                                    setFormData({ ...formData, condition: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                <option value="">Select Condition</option>
                                <option value="new">New</option>
                                <option value="like_new">Like New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <Input
                        label="Location"
                        type="text"
                        placeholder="e.g., Hostel A, Room 101"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Images
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                {existingImages.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Existing ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {existingImages.length > 0 ? 'Add More Images' : 'Images'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <ImageUpload
                            images={images}
                            setImages={setImages}
                            existingCount={existingImages.length}
                        />
                        {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting} className="flex-1">
                            Update Listing
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
