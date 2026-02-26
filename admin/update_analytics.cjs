const fs = require('fs');

const path = '/Users/gouravsinha/PROJECTS/VehicleeCare/admin/src/pages/Analytics.jsx';
let content = fs.readFileSync(path, 'utf8');

// The new desired compact layout format (from the first card the user edited):
// <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between">
//     <div className="flex items-center gap-3">
//         <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
//         <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Revenue</p>
//     </div>
//     <div className="flex items-center gap-4">
//         <h3 className="text-sm font-black text-[#011023]">₹4.2M</h3>
//         <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
//             <TrendingUp size={12} className="mr-1" /> +12.5%
//         </span>
//     </div>
// </div>

// We need to match the previous script's output components to tighten them up to this new standard
const regex = /<div className="bg-white\/60 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-\[0_8px_30px_rgba\(5,37,88,0\.04\)\] hover:shadow-lg transition-all duration-300 flex items-center justify-between">\s*<div className="flex items-center gap-3">\s*<div className="p-2\.5 ([^"]+) rounded-xl"><([a-zA-Z]+) size=\{20\} \/><\/div>\s*<p className="([^"]+)">([^<]+)<\/p>\s*<\/div>\s*<div className="flex items-center gap-4">\s*<h3 className="text-xl font-black text-\[#011023\]">([^<]+)<\/h3>\s*<span className="([^"]+)">\s*<([a-zA-Z]+) size=\{12\} className="mr-1" \/>\s*([^<]+)\s*<\/span>\s*<\/div>\s*<\/div>/g;

let matchCount = 0;

content = content.replace(regex, (match, iconClasses, iconTag, labelClasses, labelText, valueText, trendClasses, trendIcon, trendValue) => {
    matchCount++;
    // We adjust:
    // 1. icon container padding `p-2.5` -> `p-2`
    // 2. icon size `20` -> `15`
    // 3. value text size `text-xl` -> `text-sm`
    // Note: card wrapper padding remains `p-4` or `rounded-2xl` based on user's code, they removed `p-4` on the very first card, we'll keep `p-3` as a nice middle ground or just `p-3`. The user removed padding entirely on the top block and it looks very small. Let's use `p-3`. Actually, the user's diff didn't have `p-4` in the `className` string of the first card at all, they just deleted `p-4`! Let's align with that by removing it, or leaving `p-3`. Wait, let's use what they did: removed the p-4 padding.
    // User's exact wrapper: `className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between"`

    return `<div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 ${iconClasses} rounded-xl"><${iconTag} size={16} /></div>
                                <p className="${labelClasses}">${labelText}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <h3 className="text-base font-black text-[#011023]">${valueText}</h3>
                                <span className="${trendClasses}">
                                    <${trendIcon} size={12} className="mr-1" /> ${trendValue.trim()}
                                </span>
                            </div>
                        </div>`;
});

// There might be some edge cases where they removed `p-4` already.
const regexAlreadyMissingP4 = /<div className="bg-white\/60 backdrop-blur-xl border border-white rounded-2xl shadow-\[0_8px_30px_rgba\(5,37,88,0\.04\)\] hover:shadow-lg transition-all duration-300 flex items-center justify-between">\s*<div className="flex items-center gap-3">\s*<div className="p-2 ([^"]+) rounded-xl"><([a-zA-Z]+) size=\{15\} \/><\/div>\s*<p className="([^"]+)">([^<]+)<\/p>\s*<\/div>\s*<div className="flex items-center gap-4">\s*<h3 className="text-sm font-black text-\[#011023\]">([^<]+)<\/h3>\s*<span className="([^"]+)">\s*<([a-zA-Z]+) size=\{12\} className="mr-1" \/>\s*([^<]+)\s*<\/span>\s*<\/div>\s*<\/div>/g;

content = content.replace(regexAlreadyMissingP4, (match, iconClasses, iconTag, labelClasses, labelText, valueText, trendClasses, trendIcon, trendValue) => {
    // We adjust the first one they edited to match the nice padding we just applied (py-3 px-4)
    return `<div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 ${iconClasses} rounded-xl"><${iconTag} size={16} /></div>
                                <p className="${labelClasses}">${labelText}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <h3 className="text-base font-black text-[#011023]">${valueText}</h3>
                                <span className="${trendClasses}">
                                    <${trendIcon} size={12} className="mr-1" /> ${trendValue.trim()}
                                </span>
                            </div>
                        </div>`;
});

console.log(`Matched and replaced remaining cards.`);
fs.writeFileSync(path, content);
