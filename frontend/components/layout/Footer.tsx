import React from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">ThaparMarket</h3>
                        <p className="text-sm text-gray-400">
                            Your trusted campus marketplace for buying, selling, and renting items
                            within Thapar University.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-sm hover:text-white transition-colors">
                                    Browse Listings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/listings/create"
                                    className="text-sm hover:text-white transition-colors"
                                >
                                    Sell an Item
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/my-listings"
                                    className="text-sm hover:text-white transition-colors"
                                >
                                    My Listings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/messages"
                                    className="text-sm hover:text-white transition-colors"
                                >
                                    Messages
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Categories</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/?category=1" className="text-sm hover:text-white transition-colors">
                                    Electronics
                                </Link>
                            </li>
                            <li>
                                <Link href="/?category=2" className="text-sm hover:text-white transition-colors">
                                    Books
                                </Link>
                            </li>
                            <li>
                                <Link href="/?category=3" className="text-sm hover:text-white transition-colors">
                                    Furniture
                                </Link>
                            </li>
                            <li>
                                <Link href="/?category=4" className="text-sm hover:text-white transition-colors">
                                    Bikes & Equipment
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center text-sm">
                                <MapPin size={16} className="mr-2" />
                                Thapar University, Patiala
                            </li>
                            <li className="flex items-center text-sm">
                                <Mail size={16} className="mr-2" />
                                support@thaparmarket.com
                            </li>
                            <li className="flex items-center text-sm">
                                <Phone size={16} className="mr-2" />
                                +91 98765 43210
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} ThaparMarket. All rights reserved. Built for
                        Thapar University students.
                    </p>
                </div>
            </div>
        </footer>
    );
};
