'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, User, LogOut, Package, MessageSquare, Shield } from 'lucide-react';
import { messageService } from '@/services/messageService';
import { eventBus } from '@/lib/eventBus';

export const Navbar: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count
    useEffect(() => {
        if (isAuthenticated) {
            const fetchUnreadCount = async () => {
                try {
                    const result = await messageService.getUnreadCount();
                    if (result.success) {
                        setUnreadCount(result.data.unread_count || 0);
                    }
                } catch (error) {
                    // Suppress error for background polling
                    // console.error('Failed to fetch unread count:', error);
                }
            };
            fetchUnreadCount();
            // Refresh every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);

            // Listen for unread count updates
            const handleUnreadUpdate = () => {
                fetchUnreadCount();
            };
            eventBus.on('unreadCountUpdated', handleUnreadUpdate);

            return () => {
                clearInterval(interval);
                eventBus.off('unreadCountUpdated', handleUnreadUpdate);
            };
        }
    }, [isAuthenticated]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">ThaparMarket</span>
                        </Link>
                    </div>

                    {/* Search Box - Medium Size */}
                    {isAuthenticated && (
                        <div className="hidden md:flex flex-grow max-w-md">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search for items..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
                        {isAuthenticated && (
                            <Link
                                href="/"
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Browse
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/listings/create"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    + Sell Item
                                </Link>

                                <Link
                                    href="/messages"
                                    className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors relative"
                                >
                                    <MessageSquare size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User Menu */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            {user?.profile_picture ? (
                                                <img
                                                    src={user.profile_picture}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <User size={18} className="text-blue-600" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Dropdown */}
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <p className="text-sm font-medium text-gray-900">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{user?.email}</p>
                                            </Link>

                                            <Link
                                                href="/my-listings"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <Package size={16} className="mr-2" />
                                                My Listings
                                            </Link>

                                            {user?.is_admin && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <Shield size={16} className="mr-2" />
                                                    Admin Panel
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <LogOut size={16} className="mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 hover:text-blue-600 p-2"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {isAuthenticated && (
                            <Link
                                href="/"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Browse
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/listings/create"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-gray-100"
                                >
                                    + Sell Item
                                </Link>
                                <Link
                                    href="/messages"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Messages
                                </Link>
                                <Link
                                    href="/my-listings"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    My Listings
                                </Link>
                                <Link
                                    href="/profile"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Profile
                                </Link>
                                {user?.is_admin && (
                                    <Link
                                        href="/admin"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                        Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-gray-100"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};
