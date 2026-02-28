'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const sections = [
    { id: 'disclaimer', title: 'Student Initiative Notice' },
    { id: 'introduction', title: '1. Introduction' },
    { id: 'independent', title: '2. Independent Student Initiative' },
    { id: 'no-responsibility', title: '3. No Institutional Responsibility' },
    { id: 'purpose', title: '4. Purpose of the Platform' },
    { id: 'identity-data', title: '5. Identity Data We Collect' },
    { id: 'profile', title: '6. Profile Information' },
    { id: 'listing', title: '7. Listing Information' },
    { id: 'communication', title: '8. Communication Data' },
    { id: 'usage', title: '9. Usage Data' },
    { id: 'auth', title: '10. Authentication Data' },
    { id: 'purpose-collection', title: '11. Purpose of Data Collection' },
    { id: 'minimization', title: '12. Data Minimization Principle' },
    { id: 'no-sale', title: '13. No Sale of Data' },
    { id: 'visibility', title: '14. Limited Visibility' },
    { id: 'third-party', title: '15. Third-Party Services' },
    { id: 'storage', title: '16. Data Storage' },
    { id: 'security', title: '17. Data Security Measures' },
    { id: 'account-control', title: '18. User Account Control' },
    { id: 'deletion', title: '19. Account Deletion' },
    { id: 'retention', title: '20. Data Retention Policy' },
    { id: 'safety', title: '21. Platform Safety Monitoring' },
    { id: 'minors', title: '22. Minor Use Restriction' },
    { id: 'updates', title: '23. Policy Updates' },
];

export default function PrivacyPage() {
    const [activeSection, setActiveSection] = useState('disclaimer');

    const handleScrollTo = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#f5f7fa]">
            {/* Top Banner */}
            <div className="bg-[#2563eb] text-white py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-white">Privacy Policy</span>
                    </div>
                    <h1 className="text-3xl font-bold">Privacy Policy</h1>
                    <p className="text-blue-100 mt-1 text-sm">Last Updated: February 28, 2026</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

                {/* Sidebar TOC */}
                <aside className="hidden lg:block w-72 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contents</h2>
                        </div>
                        <nav className="py-2 max-h-[75vh] overflow-y-auto">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleScrollTo(s.id)}
                                    className={`w-full text-left px-5 py-2.5 text-sm transition-all duration-150 ${activeSection === s.id
                                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                        }`}
                                >
                                    {s.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 space-y-5">

                    {/* Disclaimer */}
                    <div id="disclaimer" className="bg-amber-50 border border-amber-200 rounded-xl p-6 scroll-mt-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-100 rounded-lg p-2 text-amber-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-amber-900 mb-1">Student-Led Initiative Notice</h2>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    ThaparMarket is a <strong>student-built</strong> platform independently developed for the campus community.
                                    It is <strong>not affiliated with, endorsed by, or the responsibility of Thapar Institute of Engineering and Technology (Thapar University)</strong>.
                                    The University bears no legal, financial, or administrative liability for this platform's operations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {[
                        { id: 'introduction', num: 1, title: 'Introduction', text: 'ThaparMarket is a student-built digital marketplace platform designed to facilitate peer-to-peer buying, selling, and exchange of goods within the campus community. This Privacy Policy outlines how we collect, use, store, and protect user information.' },
                        { id: 'independent', num: 2, title: 'Independent Student Initiative', text: 'ThaparMarket is an independently developed student project created for community assistance purposes. It is not affiliated with, endorsed by, sponsored by, or officially connected to Thapar Institute of Engineering and Technology (Thapar University).' },
                        { id: 'no-responsibility', num: 3, title: 'No Institutional Responsibility', text: 'Thapar University bears no legal, financial, operational, or administrative responsibility for the functioning, content, transactions, or data handling practices of this platform.' },
                        { id: 'purpose', num: 4, title: 'Purpose of the Platform', text: 'The platform is built exclusively to promote peer support and internal commerce among verified campus members in a safe digital environment.' },
                        { id: 'identity-data', num: 5, title: 'Information We Collect – Identity Data', text: 'We collect basic identification information such as name, institutional email address, and optional contact details for authentication and communication purposes.' },
                        { id: 'profile', num: 6, title: 'Profile Information', text: 'Users may voluntarily upload a profile picture and additional information to enhance trust and transparency within the marketplace.' },
                        { id: 'listing', num: 7, title: 'Listing Information', text: 'We collect data related to user listings including item descriptions, prices, images, categories, and timestamps.' },
                        { id: 'communication', num: 8, title: 'Communication Data', text: 'Messages exchanged within the platform may be stored temporarily to ensure system functionality and safety monitoring.' },
                        { id: 'usage', num: 9, title: 'Usage Data', text: 'We may collect anonymized usage statistics such as login activity, browsing behavior, and interaction logs to improve platform performance.' },
                        { id: 'auth', num: 10, title: 'Authentication Data', text: 'Secure login credentials and authentication tokens are stored in encrypted formats to maintain account security.' },
                        { id: 'purpose-collection', num: 11, title: 'Purpose of Data Collection', text: 'Data is collected solely for identity verification, listing management, communication facilitation, and overall platform improvement.' },
                        { id: 'minimization', num: 12, title: 'Data Minimization Principle', text: 'We collect only the information that is reasonably necessary to operate the platform effectively.' },
                        { id: 'no-sale', num: 13, title: 'No Sale of Data', text: 'ThaparMarket does not sell, rent, trade, or monetize user personal data under any circumstances.' },
                        { id: 'visibility', num: 14, title: 'Limited Visibility', text: 'User contact information is only shared with other users when interaction is initiated voluntarily.' },
                        { id: 'third-party', num: 15, title: 'Third-Party Services', text: 'If third-party services such as hosting or authentication providers are used, they operate under their own data protection standards.' },
                        { id: 'storage', num: 16, title: 'Data Storage', text: 'User data is stored securely using industry-standard cloud infrastructure and database systems.' },
                        { id: 'security', num: 17, title: 'Data Security Measures', text: 'We implement reasonable technical safeguards including encryption, authentication checks, and access controls.' },
                        { id: 'account-control', num: 18, title: 'User Account Control', text: 'Users may edit, update, or delete their listings at any time through their account dashboard.' },
                        { id: 'deletion', num: 19, title: 'Account Deletion', text: 'Users may request account deactivation and permanent deletion of associated data by contacting support.' },
                        { id: 'retention', num: 20, title: 'Data Retention Policy', text: 'Data is retained only for as long as necessary to maintain platform integrity or comply with applicable regulations.' },
                        { id: 'safety', num: 21, title: 'Platform Safety Monitoring', text: 'We may review activity in cases of reported abuse, fraud, or policy violations to protect the community.' },
                        { id: 'minors', num: 22, title: 'Minor Use Restriction', text: 'The platform is intended only for registered university members and not for minors outside the institution.' },
                        { id: 'updates', num: 23, title: 'Policy Updates', text: 'This Privacy Policy may be updated periodically, and continued use of the platform implies acceptance of revised terms.' },
                    ].map(({ id, num, title, text }) => (
                        <div key={id} id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-blue-600 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">{num}</span>
                                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-10">{text}</p>
                        </div>
                    ))}

                    {/* Footer links */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-4 items-center justify-between">
                        <p className="text-sm text-gray-500">Also read our other policies</p>
                        <div className="flex gap-3">
                            <Link href="/terms" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">Terms of Service</Link>
                            <Link href="/cookie-policy" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">Cookie Policy</Link>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
