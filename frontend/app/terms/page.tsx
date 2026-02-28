'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const sections = [
    { id: 'disclaimer', title: 'Student Initiative Notice' },
    { id: 'acceptance', title: '24. Acceptance of Terms' },
    { id: 'eligibility', title: '25. Eligibility Requirements' },
    { id: 'scope', title: '26. Internal Marketplace Scope' },
    { id: 'conduct', title: '27. User Conduct Standards' },
    { id: 'accuracy', title: '28. Accuracy of Listings' },
    { id: 'prohibited', title: '29. Prohibited Listings' },
    { id: 'safety', title: '30. Community Safety Requirement' },
    { id: 'transaction', title: '31. Transaction Responsibility' },
    { id: 'warranty', title: '32. No Warranty Clause' },
    { id: 'liability', title: '33. Limitation of Liability' },
];

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState('disclaimer');

    const handleScrollTo = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#f5f7fa]">
            {/* Top Banner */}
            <div className="bg-[#1e293b] text-white py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-white">Terms of Service</span>
                    </div>
                    <h1 className="text-3xl font-bold">Terms of Service</h1>
                    <p className="text-slate-400 mt-1 text-sm">Last Updated: February 28, 2026</p>
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
                                        ? 'bg-slate-50 text-slate-900 font-semibold border-l-4 border-slate-800'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                        }`}
                                >
                                    {s.title}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Quick links */}
                    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Other Policies</p>
                        <div className="space-y-2">
                            <Link href="/privacy" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                <span>→</span> Privacy Policy
                            </Link>
                            <Link href="/cookie-policy" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                <span>→</span> Cookie Policy
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 space-y-5">

                    {/* Disclaimer */}
                    <div id="disclaimer" className="bg-amber-50 border border-amber-200 rounded-xl p-6 scroll-mt-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-100 rounded-lg p-2 text-amber-700 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-amber-900 mb-1">Student-Led Initiative Notice</h2>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    ThaparMarket is a <strong>student-built</strong> platform independently developed for the campus community.
                                    It is <strong>not affiliated with, endorsed by, or the responsibility of Thapar Institute of Engineering and Technology (Thapar University)</strong>.
                                    The University bears no legal, financial, or administrative liability for this platform's operations, content, or any transactions occurring therein.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Prohibited items — special card */}
                    {[
                        { id: 'acceptance', num: 24, title: 'Acceptance of Terms', text: 'By registering and using ThaparMarket, users agree to comply with these Terms of Service in full. Continued use of the platform constitutes acceptance of any updates made to these terms.' },
                        { id: 'eligibility', num: 25, title: 'Eligibility Requirements', text: 'Access is restricted to verified members of the Thapar University community possessing valid institutional credentials. Registration requires a @thapar.edu email address.' },
                        { id: 'scope', num: 26, title: 'Internal Marketplace Scope', text: 'ThaparMarket operates as an internal university-style marketplace exclusively for campus members. It is not intended for commercial sellers or external parties.' },
                        { id: 'conduct', num: 27, title: 'User Conduct Standards', text: 'Users must act responsibly, ethically, and respectfully while engaging in listings, communications, and transactions. Harassment, spam, and abusive behavior will result in account suspension.' },
                        { id: 'accuracy', num: 28, title: 'Accuracy of Listings', text: 'All listings must contain truthful, complete, and non-misleading information. Users are solely responsible for the accuracy of the details they post.' },
                    ].map(({ id, num, title, text }) => (
                        <div key={id} id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-slate-800 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">{num}</span>
                                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-10">{text}</p>
                        </div>
                    ))}

                    {/* Prohibited Items — special grid */}
                    <div id="prohibited" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-slate-800 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">29</span>
                            <h2 className="text-base font-semibold text-gray-900">Prohibited Listings</h2>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed pl-10 mb-4">The following items and categories are strictly prohibited on ThaparMarket:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                            {[
                                'Illegal substances or controlled drugs',
                                'Weapons of any kind',
                                'Alcohol (where institutionally restricted)',
                                'Academic misconduct materials (assignments, papers)',
                                'Fraudulent or counterfeit goods',
                                'Offensive or discriminatory content',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 bg-red-50 text-red-800 text-sm px-4 py-3 rounded-lg border border-red-100">
                                    <span className="text-red-500 shrink-0">✕</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {[
                        { id: 'safety', num: 30, title: 'Community Safety Requirement', text: 'Users are encouraged to conduct transactions in secure, public campus locations such as the library, food courts, or hostel main gates. Always verify items before completing a transaction.' },
                        { id: 'transaction', num: 31, title: 'Transaction Responsibility', text: 'All transactions occur directly between buyers and sellers. ThaparMarket does not act as a broker, intermediary, or guarantor for any transaction. All payments and exchanges are the sole responsibility of the parties involved.' },
                        { id: 'warranty', num: 32, title: 'No Warranty Clause', text: 'The platform is provided "as is" without warranties of any kind regarding item quality, accuracy, availability, or user conduct. Use of the platform is at the user\'s own discretion and risk.' },
                        { id: 'liability', num: 33, title: 'Limitation of Liability', text: 'ThaparMarket and its student developers shall not be liable for any disputes, losses, damages, fraud, or misconduct arising from user interactions on the platform. Users agree to indemnify the platform against any claims arising from their use.' },
                    ].map(({ id, num, title, text }) => (
                        <div key={id} id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-slate-800 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">{num}</span>
                                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-10">{text}</p>
                        </div>
                    ))}

                    {/* Contact */}
                    <div className="bg-slate-800 rounded-xl p-6 text-white">
                        <h2 className="font-semibold mb-2">Questions about these terms?</h2>
                        <p className="text-slate-300 text-sm mb-4">Reach out to our student support team and we'll get back to you as soon as possible.</p>
                        <a
                            href="mailto:snaplocate.team@gmail.com"
                            className="inline-block bg-white text-slate-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>

                    {/* Footer links */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-4 items-center justify-between">
                        <p className="text-sm text-gray-500">Also read our other policies</p>
                        <div className="flex gap-3">
                            <Link href="/privacy" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">Privacy Policy</Link>
                            <Link href="/cookie-policy" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">Cookie Policy</Link>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
