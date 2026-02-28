'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listingService } from '@/services/listingService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/listings/ImageUpload';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';

export default function CreateListingPage() {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [categories, setCategories] = useState<any[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
            toast.error('Please login to create a listing');
            router.push('/login');
            return;
        }
        fetchCategories();
    }, [isAuthenticated, router]);

    const fetchCategories = async () => {
        try {
            const result = await listingService.getCategories();
            if (result.success) {
                setCategories(result.data.categories);
            }
        } catch (error) {

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

        if (images.length === 0) {
            newErrors.images = 'At least one image is required';
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

        setIsLoading(true);

        try {
            const result = await listingService.createListing({
                title: formData.title,
                description: formData.description,
                price: formData.price ? parseFloat(formData.price) : undefined,
                category_id: parseInt(formData.category_id),
                condition: formData.condition || undefined,
                listing_type: formData.listing_type,
                location: formData.location || undefined,
                images,
            });

            if (result.success) {
                toast.success('Listing created successfully!');
                router.push(`/listings/${result.data.listing.id}`);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
                    <p className="mt-2 text-gray-600">
                        Fill in the details below to create your listing
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

                    {/* Image Upload */}
                    <ImageUpload images={images} setImages={setImages} />
                    {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}

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
                        <Button type="submit" isLoading={isLoading} className="flex-1">
                            Create Listing
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
