import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-slate-100 py-10 bg-white mt-auto">
            <div className="max-w-[1215px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 grayscale opacity-60">
                    <span className="font-bold text-slate-800">VehicleeCare</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">BUSINESS</span>
                </div>
                <p className="text-sm text-slate-400">© 2026 VehicleeCare B2B. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
