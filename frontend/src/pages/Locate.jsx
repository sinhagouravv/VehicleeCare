import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Navigation, Phone, Clock, X, Star, Car, Wrench, CircleDollarSign, MessageCircle, Calendar, PenSquare, Loader2, CheckCircle, User } from 'lucide-react';

const Locate = () => {
    const mapRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [reviewModalData, setReviewModalData] = useState(null);
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHoverRating, setReviewHoverRating] = useState(0);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
        }
    }, []);

    const handleReviewSubmit = async () => {
        setReviewSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            
            const newReview = {
                user: user ? (user.userId || user.id || user._id) : null,
                name: user?.name || "Guest",
                designation: "Customer",
                text: reviewText,
                type: "garage",
                targetName: reviewModalData?.name,
                rating: reviewRating
            };

            const response = await fetch(`${apiUrl}/api/website-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReview)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Failed to submit review');
            }

            setReviewSubmitting(false);
            setReviewSuccess("Review submitted successfully!");
            setTimeout(() => {
                setReviewModalData(null);
                setReviewSuccess("");
                setReviewText("");
                setReviewRating(0);
                setReviewHoverRating(0);
            }, 2000);
        } catch (error) {
            console.error("Error submitting review:", error);
            setReviewSubmitting(false);
            alert(`Failed to submit review: ${error.message}\nPlease try again.`);
        }
    };

    // Live garages fetched from admin API
    // Live garages and stations fetched from admin API
    const [allCenters, setAllCenters] = useState([]);

    const fetchCenters = useCallback(async () => {
        try {
            const [garagesRes, stationsRes] = await Promise.all([
                fetch('http://localhost:5001/api/garages'),
                fetch('http://localhost:5001/api/charging-stations')
            ]);

            const garagesData = await garagesRes.json();
            const stationsData = await stationsRes.json();

            let mapped = [];

            if (garagesData.success) {
                mapped = garagesData.data.map(g => ({
                    _id: g._id,
                    name: g.name,
                    address: g.address || `${g.district || ''}, ${g.state || ''}`,
                    district: g.district,
                    state: g.state,
                    distance: 'N/A',
                    phone: g.phone || 'N/A',
                    status: 'Open',
                    lat: g.coordinates ? parseFloat(g.coordinates.split(',')[0]) : null,
                    lng: g.coordinates ? parseFloat(g.coordinates.split(',')[1]) : null,
                    rating: g.rating || 0,
                    workingHours: g.workingHours || 'N/A',
                    workingDays: g.workingDays || 'N/A',
                    vehicleTypes: (g.type || []).join(', ') || 'N/A',
                    pickupDrop: g.pickupDrop ? 'Available' : 'Not Available',
                    services: g.services || 'General Servicing',
                    whatsapp: g.whatsapp || '',
                    partner: g.partner,
                }));
            }

            let stationMapped = [];
            if (stationsData.success) {
                stationMapped = stationsData.data.map(s => ({
                    _id: s.id,
                    name: s.name,
                    address: s.address || `${s.district || ''}, ${s.state || ''}`,
                    district: s.district,
                    state: s.state,
                    distance: 'N/A',
                    phone: s.ownerContact || 'N/A',
                    status: s.status,
                    lat: s.coordinates ? parseFloat(s.coordinates.split(',')[0]) : null,
                    lng: s.coordinates ? parseFloat(s.coordinates.split(',')[1]) : null,
                    rating: 5.0,
                    workingHours: '24/7',
                    workingDays: 'Mon-Sun',
                    vehicleTypes: (s.type || []).join(', ') || 'EVs',
                    pickupDrop: 'Not Available',
                    services: `Charging Station - ${s.ports} Ports`,
                    whatsapp: '',
                    partner: false,
                    isStation: true
                }));
            }

            setAllCenters([...mapped, ...stationMapped]);
            setFilteredCenters([...mapped, ...stationMapped]);
        } catch (err) {
            console.error('Failed to fetch centers:', err);
        }
    }, []);

    useEffect(() => { fetchCenters(); }, [fetchCenters]);

    useEffect(() => {
        if (selectedCenter) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedCenter]);

    // State for filtering and search
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCenters, setFilteredCenters] = useState([]);

    // Calculate distance between two coordinates in km
    const haversineDistance = (coords1, coords2) => {
        const toRad = (x) => (x * Math.PI) / 180;
        const R = 6371; // Earth radius in km

        const dLat = toRad(coords2.lat - coords1.lat);
        const dLon = toRad(coords2.lng - coords1.lng);
        const lat1 = toRad(coords1.lat);
        const lat2 = toRad(coords2.lat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    useEffect(() => {
        if (selectedCenter) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedCenter]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query) { setFilteredCenters(allCenters); return; }
        setFilteredCenters(allCenters.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            (c.address || '').toLowerCase().includes(query.toLowerCase())
        ));
    };

    const handleUseMyLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    const sortedCenters = allCenters
                        .filter(c => c.lat && c.lng)
                        .map(center => {
                            const dist = haversineDistance({ lat: userLat, lng: userLng }, { lat: center.lat, lng: center.lng });
                            return { ...center, exactDist: dist, distance: `${dist.toFixed(1)} km` };
                        }).sort((a, b) => a.exactDist - b.exactDist);

                    setFilteredCenters(sortedCenters);
                    setSearchQuery(""); // Clear search when using location
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to retrieve your location. Please check browser permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    useEffect(() => {
        if (!window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCgdWL8F_-ZXY2xhQmpCxn0A3zWWeYvYWI`;
            script.async = true;
            script.defer = true;
            script.onload = () => setMapLoaded(true);
            document.head.appendChild(script);
        } else {
            setMapLoaded(true);
        }
    }, []);

    // Map Configuration
    const defaultMapCenter = { lat: 31.3260, lng: 75.5762 }; // Jalandhar City (Fixed Center)

    useEffect(() => {
        if (mapLoaded && mapRef.current) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: defaultMapCenter,
                disableDefaultUI: false,
                styles: [
                    {
                        "featureType": "poi",
                        "stylers": [{ "visibility": "off" }]
                    }
                ]
            });

            const bounds = new window.google.maps.LatLngBounds();

            // Add center itself to bounds
            bounds.extend(defaultMapCenter);

            filteredCenters.filter(c => c.lat && c.lng).forEach(center => {
                // Distinguish between Garages and Charging Stations via custom icons
                let markerIcon = null;
                if (center.isStation) {
                    markerIcon = {
                        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // Built-in Google green marker
                    };
                }

                const marker = new window.google.maps.Marker({
                    position: { lat: center.lat, lng: center.lng },
                    map: map,
                    title: center.name,
                    animation: window.google.maps.Animation.DROP,
                    icon: markerIcon
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div style="padding: 5px;"><strong>${center.name}</strong><br>${center.address}</div>`
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });

                // Extend bounds to include this center
                bounds.extend({ lat: center.lat, lng: center.lng });

                // CRITICAL: Also extend bounds to include the "mirrored" point relative to Jalandhar.
                // This forces the bounding box to be symmetrical around Jalandhar, ensuring fitBounds() keeps Jalandhar at the center.
                const mirroredLat = 2 * defaultMapCenter.lat - center.lat;
                const mirroredLng = 2 * defaultMapCenter.lng - center.lng;
                bounds.extend({ lat: mirroredLat, lng: mirroredLng });
            });

            // Adjust map to fit the symmetrical bounds
            map.fitBounds(bounds);
        }
    }, [mapLoaded, filteredCenters]);

    return (
        <div className="bg-gradient-to-br from-white via-blue-50 to-white h-screen overflow-hidden flex items-center py-15 relative">
            {/* Background Decorations */}
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/50 blur-3xl rounded-full pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 mt-8 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-center">
                <div className="text-center mb-11">
                    <h1 className="text-4xl font-bold text-[#011023] mb-2 uppercase">Locate Us</h1>
                    {/* <p className="text-gray-600 max-w-2xl mx-auto">Locate your nearest VehicleeCare center for premium service.</p> */}
                </div>

                <div className="flex flex-col lg:flex-row gap-4.5 h-[750px]">
                    {/* Left Column: Map */}
                    <div className="w-full lg:w-[70%] bg-white rounded-2xl overflow-hidden relative shadow-lg border border-white/50 group h-full">
                        <div ref={mapRef} className="w-full h-full bg-gray-100"></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <p className="text-gray-500 animate-pulse">Loading Map...</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Search & List */}
                    <div className="w-full lg:w-[31%] flex flex-col gap-5 h-full pr-0.5 min-h-0">
                        {/* Search Bar */}
                        <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white/50">
                            <div className="relative mb-3.25">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Enter Zip Code or City"
                                    className="w-full pl-10 pr-4 py-1.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#527FB0]/75 text-[#011023]"
                                />
                            </div>
                            <button
                                onClick={handleUseMyLocation}
                                className="w-full flex items-center justify-center gap-2 bg-[#052558] text-white text-[14.5px] py-1.75 rounded-lg font-semibold hover:bg-[#052558]/90 transition-colors"
                            >
                                <Navigation size={17} />
                                Use My Current Location
                            </button>
                        </div>

                        {/* Centers List */}
                        <div className="flex-1 overflow-y-auto pr-0.5 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                            {filteredCenters.map((center, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        const section = document.getElementById('locate');
                                        if (section) {
                                            section.scrollIntoView({ behavior: 'smooth' });
                                            setTimeout(() => {
                                                setSelectedCenter(center);
                                            }, 500);
                                        } else {
                                            setSelectedCenter(center);
                                        }
                                    }}
                                    className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-all cursor-pointer group hover:bg-white"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[#011023] uppercase group-hover:text-[#527FB0] transition-colors">{center.name}</h3>
                                        {/* <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py- rounded-full">{center.distance}</span> */}
                                    </div>
                                    <div className="flex items-start gap-1 text-[13px] text-gray-600 mb-2">
                                        <MapPin size={15} className={`mt-0.5 flex-shrink-0 ${center.isStation ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        <p>{center.address}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                            <Clock size={12} /> {center.status}
                                        </span>
                                        <a href="#" className="text-xs font-bold text-[#052558] flex items-center gap-1">
                                            <Phone size={12} /> {center.phone}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Pop-up Modal */}
            {selectedCenter && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 animate-in fade-in duration-300 ease-out"
                    onClick={() => setSelectedCenter(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl relative animate-in fade-in zoom-in-90 slide-in-from-bottom-4 duration-500 ease-out max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedCenter(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-[#011023] uppercase mb-2">{selectedCenter.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-sm font-bold">
                                    <Star size={14} className="fill-current" /> {selectedCenter.rating}
                                </span>
                                <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                    {selectedCenter.distance} away
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6.5">
                                <div className="flex items-start gap-3 text-gray-600">
                                    <Clock className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                    <div>
                                        <p className="font-medium text-[#011023] text-sm">Working Hours</p>
                                        <p className="text-sm">{selectedCenter.workingHours}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-gray-600">
                                    <Calendar className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                    <div>
                                        <p className="font-medium text-[#011023] text-sm">Working Days</p>
                                        <p className="text-sm">{selectedCenter.workingDays}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-gray-600">
                                    <Car className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                    <div>
                                        <p className="font-medium text-[#011023] text-sm">Vehicle Support</p>
                                        <p className="text-sm">{selectedCenter.vehicleTypes}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-gray-600">
                                    <Navigation className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                    <div>
                                        <p className="font-medium text-[#011023] text-sm">Pickup & Drop</p>
                                        <p className="text-sm">{selectedCenter.pickupDrop}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-gray-600 pt-2 border-t border-gray-100">
                                <MapPin className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-[#011023] text-sm">Address</p>
                                    <p className="text-sm">{selectedCenter.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-gray-600 pt-2">
                                <Wrench className="text-[#527FB0] mt-1 shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-[#011023] text-sm">Services Available</p>
                                    <p className="text-sm">{selectedCenter.services}</p>
                                </div>
                            </div>


                        </div>

                        <div className="mt-8 grid grid-cols-4 gap-3">
                            <button className="w-full bg-[#052558] text-white uppercase py-2.5 text-sm rounded-xl font-medium hover:bg-[#052558]/90 transition-colors flex items-center justify-center gap-2">
                                <Navigation size={16} />
                                Directions
                            </button>
                            <button className="w-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700 uppercase py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <Phone size={16} />
                                Call
                            </button>
                            <button className="w-full bg-[#25D366] text-white uppercase py-2.5 text-sm rounded-xl font-medium hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <MessageCircle size={16} />
                                WhatsApp
                            </button>
                            <button 
                                onClick={() => setReviewModalData(selectedCenter)}
                                className="w-full bg-blue-50 text-blue-600 border border-blue-100 uppercase py-2.5 text-sm rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <PenSquare size={16} />
                                Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ── WRITE REVIEW MODAL ────────────────────────── */}
            {reviewModalData && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/0 backdrop-blur- animate-in fade-in duration-300" onClick={() => !reviewSubmitting && setReviewModalData(null)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-blue-50 border-b border-blue-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Write a Review</h3>
                            <button 
                                onClick={() => setReviewModalData(null)}
                                className="absolute right-7 text-blue-400 hover:text-blue-600 rounded-xl transition-colors"
                                disabled={reviewSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {reviewSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                                        <CheckCircle size={32} className="text-green-500" />
                                    </div>
                                    <p className="text-lg font-bold text-[#011023] text-center uppercase tracking-tight">{reviewSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[14.5px] uppercase font-semibold text-blue-700">
                                                Reviewing: <span className="font-bold text-[#052558]">{reviewModalData.name}</span>
                                            </p>
                                            <p className="text-[13px] text-blue-500 mt-1 flex items-center gap-1">
                                                <User size={14} />
                                                Posting as <span className="font-semibold uppercase">{user?.name || "Guest"}</span> (ID: {user?.userId || user?._id || user?.id || "N/A"})
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center border-y border-gray-100">
                                            <p className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rate your experience</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        disabled={reviewSubmitting}
                                                        className=" hover:scale-110"
                                                        onMouseEnter={() => setReviewHoverRating(star)}
                                                        onMouseLeave={() => setReviewHoverRating(0)}
                                                        onClick={() => setReviewRating(star)}
                                                    >
                                                        <Star 
                                                            size={24} 
                                                            className={`transition-all duration-200 ${
                                                                (reviewHoverRating || reviewRating) >= star 
                                                                ? "text-yellow-400 fill-yellow-400 drop-shadow-xs" 
                                                                : "text-gray-200"
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[14.25px] pl-1 font-semibold text-[#052558] uppercase tracking-wider flex items-center justify-between">
                                            <span>Share your experience</span>
                                        </label>
                                        <textarea 
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 mt-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/10 transition-all resize-none font-medium text-gray-700 shadow-sm"
                                            disabled={reviewSubmitting}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!reviewSuccess && (
                            <div className="px-6 pb-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    onClick={() => setReviewModalData(null)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={reviewSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleReviewSubmit}
                                    disabled={reviewSubmitting || !reviewText.trim() || reviewRating === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#052558]/90 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0a3a82] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {reviewSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <PenSquare size={16} />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Locate;
