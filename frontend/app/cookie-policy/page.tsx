'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const sections = [
    { id: 'disclaimer', title: 'Student Initiative Notice' },
    { id: 'what-are', title: '34. Cookie Usage Disclosure' },
    { id: 'essential', title: '35. Essential Cookies' },
    { id: 'functional', title: '36. Functional Cookies' },
    { id: 'no-advertising', title: '37. No Advertising Cookies' },
    { id: 'control', title: '38. Cookie Control' },
    { id: 'consent', title: '39. Continued Use Consent' },
];

const cookieTypes = [
    {
        id: 'essential',
        icon: '🔐',
        name: 'Essential Cookies',
        description: 'Required for authentication, session management, and secure access to user accounts.',
        examples: ['Login session token', 'CSRF security token', 'Auth state'],
        canDisable: false,
        color: 'green',
    },
    {
        id: 'functional',
        icon: '⚙️',
        name: 'Functional Cookies',
        description: 'Store user interface preferences such as theme selection or search filter settings.',
        examples: ['UI theme preference', 'Search filter state'],
        canDisable: true,
        color: 'blue',
    },
    {
        id: 'advertising',
        icon: '🚫',
        name: 'Advertising / Tracking Cookies',
        description: 'ThaparMarket does NOT use any advertising, behavioral tracking, or analytics cookies for monetization.',
        examples: ['Not used'],
        canDisable: false,
        color: 'red',
        notUsed: true,
    },
];

export default function CookiePolicyPage() {
    const [activeSection, setActiveSection] = useState('disclaimer');

    const handleScrollTo = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#f5f7fa]">
            {/* Top Banner */}
            <div className="bg-[#0f766e] text-white py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-teal-200 text-sm mb-2">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-white">Cookie Policy</span>
                    </div>
                    <h1 className="text-3xl font-bold">Cookie Policy</h1>
                    <p className="text-teal-100 mt-1 text-sm">Last Updated: February 28, 2026</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

                {/* Sidebar TOC */}
                <aside className="hidden lg:block w-72 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contents</h2>
                        </div>
                        <nav className="py-2">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleScrollTo(s.id)}
                                    className={`w-full text-left px-5 py-2.5 text-sm transition-all duration-150 ${activeSection === s.id
                                            ? 'bg-teal-50 text-teal-700 font-semibold border-l-4 border-teal-600'
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
                            <Link href="/terms" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                <span>→</span> Terms of Service
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
                                    The University bears no legal or administrative liability for this platform's data handling or operations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Intro */}
                    <div id="what-are" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-teal-600 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">34</span>
                            <h2 className="text-base font-semibold text-gray-900">Cookie Usage Disclosure</h2>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed pl-10">
                            ThaparMarket uses cookies and similar technologies to maintain secure login sessions and enhance user experience.
                            Cookies are small text files stored in your browser that allow us to recognize returning users and remember preferences.
                        </p>
                    </div>

                    {/* Cookie Types — visual cards */}
                    <div id="essential" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-5">Cookie Types We Use</h2>
                        <div className="space-y-4">
                            {cookieTypes.map((cookie) => (
                                <div
                                    key={cookie.id}
                                    className={`rounded-xl border p-5 ${cookie.notUsed
                                            ? 'bg-red-50 border-red-100'
                                            : cookie.color === 'green'
                                                ? 'bg-green-50 border-green-100'
                                                : 'bg-blue-50 border-blue-100'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cookie.icon}</span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm">{cookie.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{cookie.description}</p>
                                            </div>
                                        </div>
                                        {cookie.notUsed ? (
                                            <span className="shrink-0 text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">Not Used</span>
                                        ) : (
                                            <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${cookie.canDisable
                                                    ? 'text-blue-700 bg-blue-100'
                                                    : 'text-green-700 bg-green-100'
                                                }`}>
                                                {cookie.canDisable ? 'Optional' : 'Always On'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pl-9 flex gap-2 flex-wrap mt-2">
                                        {cookie.examples.map((ex) => (
                                            <span key={ex} className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-600">{ex}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Remaining clauses */}
                    {[
                        {
                            id: 'functional',
                            num: 36,
                            title: 'Functional Cookies',
                            text: 'Functional cookies may store user interface preferences such as theme selection or search filters to improve the personalised experience across sessions.',
                        },
                        {
                            id: 'no-advertising',
                            num: 37,
                            title: 'No Advertising Cookies',
                            text: 'The platform does not use advertising, remarketing, or behavioral tracking cookies for monetization purposes. We do not share browsing data with any ad network.',
                        },
                        {
                            id: 'control',
                            num: 38,
                            title: 'Cookie Control',
                            text: 'Users may disable cookies via their browser settings at any time; however, disabling essential cookies may prevent proper login and account access on ThaparMarket.',
                        },
                        {
                            id: 'consent',
                            num: 39,
                            title: 'Continued Use Consent',
                            text: 'By continuing to use ThaparMarket, users consent to the use of essential and functional cookies as described in this policy.',
                        },
                    ].map(({ id, num, title, text }) => (
                        <div key={id} id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-teal-600 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">{num}</span>
                                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-10">{text}</p>
                        </div>
                    ))}

                    {/* Footer links */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-4 items-center justify-between">
                        <p className="text-sm text-gray-500">Also read our other policies</p>
                        <div className="flex gap-3">
                            <Link href="/privacy" className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">Terms of Service</Link>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
