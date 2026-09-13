import React from 'react';

const GuestRestrictedOverlay = ({ message = "This page has sensitive information, Guest garage are<br/> not allowed to access it" }) => {
    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md bg-white/60 rounded-2xl pointer-events-auto animate-in fade-in duration-300">
            <div className="max-w-lg w-full text-center animate-in zoom-in-95 duration-300 -translate-x-[2.75rem]">
                <div className="space-y-2 mb-15">
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: message }} />
                </div>
            </div>
        </div>
    );
};

export default GuestRestrictedOverlay;
