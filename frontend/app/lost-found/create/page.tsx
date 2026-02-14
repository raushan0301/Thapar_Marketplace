'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { lostFoundService } from '@/services/lostFoundService';
import { useAuthStore } from '@/store/authStore';
import { Upload, X, MapPin, Calendar, Gift, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function CreateLostFoundPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuthStore();

    const typeFromUrl = searchParams.get('type') as 'lost' | 'found' | null;
    const [listingType, setListingType] = useState<'lost' | 'found'>(typeFromUrl || 'lost');
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
        fetchCategories();
    }, [isAuthenticated]);

    const fetchCategories = async () => {
        try {
            const response = await lostFoundService.getCategories();
            if (response.success) {
                setCategories(response.data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        setImages(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.category_id) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category_id', formData.category_id);
            submitData.append('listing_type', listingType);

            if (formData.location) submitData.append('location', formData.location);
            if (formData.incident_date) submitData.append('incident_date', formData.incident_date);
            if (formData.reward && listingType === 'lost') submitData.append('reward', formData.reward);

            // Append images
            images.forEach(image => {
                submitData.append('images', image);
            });

            const response = await lostFoundService.createItem(submitData);

            if (response.success) {
                alert(`${listingType === 'lost' ? 'Lost' : 'Found'} item posted successfully!`);
                router.push('/lost-found');
            } else {
                alert('Failed to create item: ' + (response.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Error creating item:', error);
            alert('Failed to create item: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

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
                        {listingType === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {listingType === 'lost'
                            ? 'Help others help you find your lost item by providing detailed information.'
                            : 'Help reunite this item with its owner by providing clear details.'}
                    </p>

                    {/* Type Toggle */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setListingType('lost')}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${listingType === 'lost'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            🔴 I Lost Something
                        </button>
                        <button
                            onClick={() => setListingType('found')}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${listingType === 'found'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            🟢 I Found Something
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Item Title <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={listingType === 'lost' ? 'e.g., Blue Wallet' : 'e.g., Found Blue Wallet'}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Description <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={
                                listingType === 'lost'
                                    ? 'Describe the item in detail (color, brand, distinguishing features, etc.)'
                                    : 'Describe where and when you found it, and any identifying details'
                            }
                            rows={5}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Category <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            {listingType === 'lost' ? 'Last Seen Location' : 'Found At'}
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Library, C-Block, Hostel A"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            {listingType === 'lost' ? 'When did you lose it?' : 'When did you find it?'}
                        </label>
                        <input
                            type="date"
                            value={formData.incident_date}
                            onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {/* Reward (Only for Lost Items) */}
                    {listingType === 'lost' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <Gift size={16} className="text-green-600" />
                                Reward (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.reward}
                                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                                placeholder="e.g., ₹500, Treat at canteen"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                Offering a reward can increase the chances of recovery
                            </p>
                        </div>
                    )}

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Upload size={16} className="text-gray-400" />
                            Photos (Max 5)
                        </label>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {images.length < 5 && (
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors">
                                <Upload className="text-gray-400 mb-1.5" size={28} />
                                <span className="text-sm text-gray-500">Click to upload images</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-6 py-2.5 rounded-lg font-medium text-white transition-all text-sm ${listingType === 'lost'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Posting...' : `Post ${listingType === 'lost' ? 'Lost' : 'Found'} Item`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
