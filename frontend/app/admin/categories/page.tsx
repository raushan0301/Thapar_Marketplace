'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Plus, Edit2, Trash2, ChevronLeft, Tag } from 'lucide-react';

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'buy_sell',
        icon: '',
        description: '',
    });

    useEffect(() => {
        if (!isAuthenticated || !user?.is_admin) {
            toast.error('Access denied');
            router.push('/');
            return;
        }
        fetchCategories();
    }, [isAuthenticated, user, router]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/listings/categories');
            if (response.data.success) {
                setCategories(response.data.data.categories);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            if (selectedCategory) {
                // Update existing category
                const response = await api.put(`/admin/categories/${selectedCategory.id}`, formData);
                if (response.data.success) {
                    toast.success('Category updated successfully');
                }
            } else {
                // Create new category
                const response = await api.post('/admin/categories', formData);
                if (response.data.success) {
                    toast.success('Category created successfully');
                }
            }
            fetchCategories();
            handleCloseModal();
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        setIsProcessing(true);
        try {
            const response = await api.delete(`/admin/categories/${selectedCategory.id}`);
            if (response.data.success) {
                toast.success('Category deleted successfully');
                fetchCategories();
                setShowDeleteModal(false);
                setSelectedCategory(null);
            }
        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            icon: category.icon || '',
            description: category.description || '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
        setFormData({
            name: '',
            type: 'buy_sell',
            icon: '',
            description: '',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft size={20} className="mr-1" />
                        Back to Dashboard
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
                            <p className="text-gray-600 mt-2">Manage listing categories</p>
                        </div>
                        <Button onClick={() => setShowModal(true)}>
                            <Plus size={20} className="mr-2" />
                            Add Category
                        </Button>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No categories found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{category.icon || '📦'}</span>
                                                    <span className="font-medium text-gray-900">{category.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    {category.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {category.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${category.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(category)}
                                                        className="text-blue-600 hover:text-blue-700 flex items-center"
                                                    >
                                                        <Edit2 size={16} className="mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCategory(category);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-700 flex items-center"
                                                    >
                                                        <Trash2 size={16} className="mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={selectedCategory ? 'Edit Category' : 'Add New Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Category Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Electronics"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        >
                            <option value="buy_sell">Buy/Sell</option>
                            <option value="rental">Rental</option>
                            <option value="lost_found">Lost & Found</option>
                        </select>
                    </div>

                    <Input
                        label="Icon (Emoji)"
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g., 💻"
                        maxLength={2}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this category"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseModal}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isProcessing} className="flex-1">
                            {selectedCategory ? 'Update' : 'Create'} Category
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedCategory(null);
                }}
                title="Delete Category"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete{' '}
                        <strong>{selectedCategory?.name}</strong>?
                    </p>
                    <p className="text-sm text-gray-600">
                        This action cannot be undone. All listings in this category will need to be recategorized.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedCategory(null);
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isProcessing}
                            className="flex-1"
                        >
                            Delete Category
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
