'use client';

import React, { useState, useEffect } from 'react';
import { listingService } from '@/services/listingService';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    listing_type: '',
    min_price: '',
    max_price: '',
    condition: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalListings: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await listingService.getCategories();
      if (result.success) {
        setCategories(result.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchListings = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 12,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.listing_type) params.listing_type = filters.listing_type;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.condition) params.condition = filters.condition;

      const result = await listingService.getListings(params);

      if (result.success) {
        setListings(result.data.listings);
        setPagination(result.data.pagination);
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      listing_type: '',
      min_price: '',
      max_price: '',
      condition: '',
    });
    fetchListings(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter Chips */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={async () => {
                setFilters({ ...filters, category_id: '' });
                setIsLoading(true);
                setListings([]); // Clear listings immediately

                const params: any = {
                  page: 1,
                  limit: 12,
                };
                if (filters.search) params.search = filters.search;
                // Don't include category_id - we want all categories
                if (filters.listing_type) params.listing_type = filters.listing_type;
                if (filters.min_price) params.min_price = filters.min_price;
                if (filters.max_price) params.max_price = filters.max_price;
                if (filters.condition) params.condition = filters.condition;

                try {
                  const result = await listingService.getListings(params);
                  if (result.success) {
                    setListings(result.data.listings);
                    setPagination(result.data.pagination);
                  }
                } catch (error: any) {
                  const errorMessage = handleApiError(error);
                  toast.error(errorMessage);
                } finally {
                  setIsLoading(false);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filters.category_id === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-400 hover:bg-gray-50'
                }`}
            >
              All Categories
              <span className="ml-2 text-xs opacity-75">{pagination.totalListings}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={async () => {
                  setFilters({ ...filters, category_id: cat.id.toString() });
                  setIsLoading(true);
                  setListings([]); // Clear listings immediately

                  const params: any = {
                    page: 1,
                    limit: 12,
                    category_id: cat.id, // Use the category ID directly
                  };
                  if (filters.search) params.search = filters.search;
                  if (filters.listing_type) params.listing_type = filters.listing_type;
                  if (filters.min_price) params.min_price = filters.min_price;
                  if (filters.max_price) params.max_price = filters.max_price;
                  if (filters.condition) params.condition = filters.condition;

                  try {
                    const result = await listingService.getListings(params);
                    if (result.success) {
                      setListings(result.data.listings);
                      setPagination(result.data.pagination);
                    }
                  } catch (error: any) {
                    const errorMessage = handleApiError(error);
                    toast.error(errorMessage);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filters.category_id === cat.id.toString()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-400 hover:bg-gray-50'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header with Sort */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {pagination.totalListings} items
          </p>
          <select
            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            defaultValue="newest"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md h-96 animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No listings found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="ghost"
                  onClick={() => fetchListings(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft size={20} />
                </Button>

                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <Button
                  variant="ghost"
                  onClick={() => fetchListings(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
