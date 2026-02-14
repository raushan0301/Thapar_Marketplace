'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { lostFoundService, LostFoundItem } from '@/services/lostFoundService';
import { useAuthStore } from '@/store/authStore';
import { Upload, X, MapPin, Calendar, Gift, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditLostFoundPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isAuthenticated } = useAuthStore();

    const [item, setItem] = useState<LostFoundItem | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Images
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        location: '',
        incident_date: '',
        reward: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchItemAndCategories();
    }, [isAuthenticated, params.itemId]);

    const fetchItemAndCategories = async () => {
        try {
            setLoading(true);

            // Fetch item details
            const itemResponse = await lostFoundService.getItemById(params.itemId as string);
            if (!itemResponse.success) {
                toast.error('Item not found');
                router.push('/lost-found');
                return;
            }

            const fetchedItem = itemResponse.data.item;

            // Check if user owns this item
            if (fetchedItem.user_id !== user?.id) {
                toast.error('You can only edit your own items');
                router.push('/lost-found');
                return;
            }

            setItem(fetchedItem);
            setExistingImages(fetchedItem.images || []);

            // Pre-fill form
            setFormData({
                title: fetchedItem.title || '',
                description: fetchedItem.description || '',
                category_id: fetchedItem.category_id?.toString() || '',
                location: fetchedItem.location || '',
                incident_date: fetchedItem.incident_date ? fetchedItem.incident_date.split('T')[0] : '',
                reward: fetchedItem.reward || '',
            });

            // Fetch categories
            const catResponse = await lostFoundService.getCategories();
            if (catResponse.success) {
                setCategories(catResponse.data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load item details');
            router.push('/lost-found');
        } finally {
            setLoading(false);
        }
    };

    const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalImages = existingImages.length + newImages.length + files.length;

        if (totalImages > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setNewImages(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.category_id) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (existingImages.length + newImages.length === 0) {
            toast.error('Please add at least one image');
            return;
        }

        try {
            setSubmitting(true);

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category_id', formData.category_id);

            if (formData.location) submitData.append('location', formData.location);
            if (formData.incident_date) submitData.append('incident_date', formData.incident_date);
            if (formData.reward && item?.listing_type === 'lost') submitData.append('reward', formData.reward);

            // Append existing images (as JSON string)
            submitData.append('existing_images', JSON.stringify(existingImages));

            // Append new images
            newImages.forEach(image => {
                submitData.append('images', image);
            });

            const response = await lostFoundService.updateItem(params.itemId as string, submitData);

            if (response.success) {
                toast.success('Item updated successfully!');
                router.push(`/lost-found/${params.itemId}`);
            } else {
                toast.error('Failed to update item: ' + (response.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Error updating item:', error);
            toast.error('Failed to update item: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return null;
    }

    const isLost = item.listing_type === 'lost';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Edit {isLost ? 'Lost' : 'Found'} Item
                    </h1>
                    <p className="text-gray-600">
                        Update the details of your {isLost ? 'lost' : 'found'} item.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="e.g., Black Wallet, Student ID Card"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-500"
                                placeholder="Provide detailed description..."
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location & Date */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Date</h2>

                        {/* Location */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin size={16} className="inline mr-1" />
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="e.g., Library, Hostel A, Academic Block"
                            />
                        </div>

                        {/* Incident Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                {isLost ? 'Date Lost' : 'Date Found'}
                            </label>
                            <input
                                type="date"
                                value={formData.incident_date}
                                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Reward (Lost items only) */}
                    {isLost && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reward (Optional)</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Gift size={16} className="inline mr-1" />
                                    Reward Amount
                                </label>
                                <input
                                    type="text"
                                    value={formData.reward}
                                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                    placeholder="e.g., ₹500, Coffee treat"
                                />
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Images <span className="text-sm text-gray-500">(Max 5)</span>
                        </h2>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {existingImages.map((url, index) => (
                                        <div key={`existing-${index}`} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Existing ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Images */}
                        {newImagePreviews.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">New Images:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {newImagePreviews.map((preview, index) => (
                                        <div key={`new-${index}`} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`New ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        {(existingImages.length + newImages.length) < 5 && (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload images</span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {5 - existingImages.length - newImages.length} more allowed
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleNewImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all ${isLost
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </span>
                            ) : (
                                'Update Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
