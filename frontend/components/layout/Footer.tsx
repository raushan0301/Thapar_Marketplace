import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

                    {/* Brand Section */}
                    <div>
                        <h3 className="text-white text-lg font-bold tracking-wide">THAPAR MARKET</h3>
                        <p className="mt-2 text-sm text-slate-400 max-w-md">
                            The community marketplace for Thapar University.
                            Facilitating secure and convenient campus transactions.
                        </p>
                    </div>

                    {/* Contact Section - Professional Row */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg">
                                <Mail size={18} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Support Email</p>
                                <a href="mailto:snaplocate.team@gmail.com" className="text-white hover:text-blue-400 transition-colors">
                                    snaplocate.team@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg">
                                <MapPin size={18} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Location</p>
                                <p className="text-white">Thapar University, Patiala</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} ThaparMarket. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
                        <span className="hover:text-slate-300 cursor-pointer transition-colors">Cookie Policy</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
