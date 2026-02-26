const fs = require('fs');

const path = '/Users/gouravsinha/PROJECTS/VehicleeCare/admin/src/pages/Analytics.jsx';
let content = fs.readFileSync(path, 'utf8');

// The user wanted:
// - A main 2x2 grid `grid-cols-1 md:grid-cols-2`.
// - 4 category blocks each with a label (e.g., "Revenue") and a nested 2x2 grid `grid-cols-1 md:grid-cols-2`.
// They manually duplicated the first category block 4 times (Revenue, Bookings, Charging, Users), but they broke the main wrapper.

// Let's replace the whole body from `div className="grid grid-cols-1 md:grid-cols-2 gap-5"` down to `{/* Charts...`
const startMarker = '<div className="grid grid-cols-1 md:grid-cols-2 gap-5">';
const endMarker = '{/* Charts Area View */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find markers.", startIndex, endIndex);
    process.exit(1);
}

const replacement = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* 1. REVENUE OVERVIEW */}
                <div className="bg-white/40 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 group flex flex-col gap-2">
                    <h2 className="text-xl font-black text-[#011023] uppercase tracking-tight px-1 flex items-center justify-between">
                        REvenue
                        <div className="p-2 bg-white/60 rounded-xl group-hover:bg-white transition-colors border border-white"><DollarSign size={20} className="text-[#527FB0]" /></div>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><DollarSign size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +12.5%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-2xl font-black text-[#011023]">₹4.2M</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +8.2%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Daily Revenue</p>
                            <h3 className="text-2xl font-black text-[#011023]">₹84k</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><DollarSign size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +24.1%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Garage Revenue</p>
                            <h3 className="text-2xl font-black text-[#011023]">₹2.8M</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +4.3%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Charging Revenue</p>
                            <h3 className="text-2xl font-black text-[#011023]">₹1.4M</h3>
                        </div>
                    </div>
                </div>

                {/* 2. BOOKING OVERVIEW */}
                <div className="bg-white/40 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 group flex flex-col gap-2">
                    <h2 className="text-xl font-black text-[#011023] uppercase tracking-tight px-1 flex items-center justify-between">
                        Bookings
                        <div className="p-2 bg-white/60 rounded-xl group-hover:bg-white transition-colors border border-white"><Activity size={20} className="text-[#527FB0]" /></div>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +15.5%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Total Bookings</p>
                            <h3 className="text-2xl font-black text-[#011023]">6,284</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Users size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +6.2%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Service Bookings</p>
                            <h3 className="text-2xl font-black text-[#011023]">4,192</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +20.1%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Charging Bookings</p>
                            <h3 className="text-2xl font-black text-[#011023]">2,092</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><TrendingUp size={18} /></div>
                                <span className="flex items-center text-gray-500 text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-md">
                                     -2.1%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Cancelled Bookings</p>
                            <h3 className="text-2xl font-black text-[#011023]">124</h3>
                        </div>
                    </div>
                </div>

                {/* 3. USER OVERVIEW */}
                <div className="bg-white/40 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 group flex flex-col gap-2">
                    <h2 className="text-xl font-black text-[#011023] uppercase tracking-tight px-1 flex items-center justify-between">
                        Users
                        <div className="p-2 bg-white/60 rounded-xl group-hover:bg-white transition-colors border border-white"><Users size={20} className="text-[#527FB0]" /></div>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><Users size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +10.5%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Total Users</p>
                            <h3 className="text-2xl font-black text-[#011023]">12,842</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +12.2%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Active Monthly</p>
                            <h3 className="text-2xl font-black text-[#011023]">8,492</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><TrendingUp size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +8.1%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">New Registrations</p>
                            <h3 className="text-2xl font-black text-[#011023]">482</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><DollarSign size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +5.3%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Premium Users</p>
                            <h3 className="text-2xl font-black text-[#011023]">1,204</h3>
                        </div>
                    </div>
                </div>

                {/* 4. INFRASTRUCTURE OVERVIEW */}
                <div className="bg-white/40 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 group flex flex-col gap-2">
                    <h2 className="text-xl font-black text-[#011023] uppercase tracking-tight px-1 flex items-center justify-between">
                        Infrastructure
                        <div className="p-2 bg-white/60 rounded-xl group-hover:bg-white transition-colors border border-white"><Activity size={20} className="text-[#527FB0]" /></div>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +4.5%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Total Garages</p>
                            <h3 className="text-2xl font-black text-[#011023]">242</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Users size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +5.2%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Active Garages</p>
                            <h3 className="text-2xl font-black text-[#011023]">198</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Activity size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +14.1%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Total Stations</p>
                            <h3 className="text-2xl font-black text-[#011023]">84</h3>
                        </div>
                        <div className="bg-white/80 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><TrendingUp size={18} /></div>
                                <span className="flex items-center text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                    <TrendingUp size={12} className="mr-1" /> +12.3%
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold mb-1 text-[11px] uppercase tracking-wider">Active Stations</p>
                            <h3 className="text-2xl font-black text-[#011023]">76</h3>
                        </div>
                    </div>
                </div>

            </div>

            `;
            
// Also fix bottom syntax
let updatedContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
updatedContent = updatedContent.replace(/\s+\};\s+export default Analytics;/g, '\n};\n\nexport default Analytics;');
updatedContent = updatedContent.replace(/\s+\);\s+\};\s+export default Analytics;/g, '\n    );\n};\n\nexport default Analytics;');

// Fix multiple closed divs at the very bottom
updatedContent = updatedContent.replace(/<\/div>\s*<\/div>\s*\);\s*\}/g, '    </div>\n    );\n}');

fs.writeFileSync(path, updatedContent);
console.log("Analytics.jsx successfully updated and fixed!");
