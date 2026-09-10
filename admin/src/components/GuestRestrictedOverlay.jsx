const GuestRestrictedOverlay = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-in fade-in duration-300">
            <div className="max-w-md w-full text-center pointer-events-auto animate-in zoom-in-95 duration-300">
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 leading-relaxed uppercase">
                        This page has sensitive information, Guest admin are not allowed to access it
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuestRestrictedOverlay;
