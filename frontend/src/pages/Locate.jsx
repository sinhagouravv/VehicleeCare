import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation, Phone, Clock, X, Star, Car, Wrench, CircleDollarSign, MessageCircle, Calendar } from 'lucide-react';

const Locate = () => {
    const mapRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);

    // Standardized Service Center Data Structure (Template for Admin Panel)
    // When a new center is added via Admin, it must follow this exact format:
    // {
    //     name: string,           // e.g., "Center Name"
    //     address: string,        // e.g., "Full Address"
    //     distance: string,       // e.g., "2.5 km" (Calculated or Manual)
    //     phone: string,          // e.g., "+91 XXXXX XXXXX"
    //     status: string,         // e.g., "Open Now" | "Closed"
    //     lat: number,            // Latitude
    //     lng: number,            // Longitude
    //     rating: number,         // Rating (0-5)
    //     workingHours: string,   // e.g., "9:00 AM - 8:00 PM"
    //     workingDays: string,    // e.g., "Mon - Sun"
    //     vehicleTypes: string,   // "Petrol, Diesel, EV"
    //     pickupDrop: string,     // "Available" | "Not Available"
    //     services: string,       // Comma-separated list
    //     whatsapp: string        // numeric string for WhatsApp link
    // }
    const centers = [
        {
            name: "Jalandhar City Hub",
            address: "Model Town, Jalandhar",
            distance: "2.5 km",
            phone: "+91 98765 43210",
            status: "Open Now",
            lat: 31.3260,
            lng: 75.5762,
            rating: 4.8,
            workingHours: "9:00 AM - 8:00 PM",
            workingDays: "Mon - Sun",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available",
            services: "General Service, Denting, Painting",
            whatsapp: "919876543210"
        },
        {
            name: "Phagwara Service Point",
            address: "GT Road, Phagwara",
            distance: "15 km",
            phone: "+91 98765 43211",
            status: "Open Now",
            lat: 31.2240,
            lng: 75.7708,
            rating: 4.5,
            workingHours: "9:30 AM - 7:30 PM",
            workingDays: "Mon - Sat",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available",
            services: "General Service, Washing, Detailing",
            whatsapp: "919876543211"
        },
        {
            name: "Ludhiana Garage",
            address: "Ferozepur Road, Ludhiana",
            distance: "45 km",
            phone: "+91 98765 43212",
            status: "Closing Soon",
            lat: 30.9010,
            lng: 75.8573,
            rating: 4.2,
            workingHours: "10:00 AM - 9:00 PM",
            workingDays: "Mon - Sat",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available (5km radius)",
            services: "Engine Repair, Wheel Alignment",
            whatsapp: "919876543212"
        },
        {
            name: "Amritsar Auto Works",
            address: "Lawrence Road, Amritsar",
            distance: "80 km",
            phone: "+91 98765 43213",
            status: "Open Now",
            lat: 31.6340,
            lng: 74.8723,
            rating: 4.7,
            workingHours: "9:00 AM - 7:00 PM",
            workingDays: "Mon - Sun",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Not Available",
            services: "Detailing, Ceramic Coating",
            whatsapp: "919876543213"
        },
        {
            name: "Chandigarh Workshop",
            address: "Sector 17, Chandigarh",
            distance: "150 km",
            phone: "+91 98765 43214",
            status: "Open Now",
            lat: 30.7333,
            lng: 76.7794,
            rating: 4.9,
            workingHours: "24/7 Service",
            workingDays: "Everyday",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available",
            services: "Emergency Repair, Towing",
            whatsapp: "919876543214"
        },
        {
            name: "Patiala Auto Hub",
            address: "YPS Road, Patiala",
            distance: "45 km",
            phone: "+91 98765 43215",
            status: "Open Now",
            lat: 30.3398,
            lng: 76.3869,
            rating: 4.4,
            workingHours: "9:00 AM - 8:00 PM",
            workingDays: "Mon - Sat",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available",
            services: "General Service, Oil Change",
            avgCost: "₹2,500 approx",
            whatsapp: "919876543215"
        },
        {
            name: "Bathinda Service Zone",
            address: "Power House Road, Bathinda",
            distance: "180 km",
            phone: "+91 98765 43216",
            status: "Open Now",
            lat: 30.2109,
            lng: 74.9454,
            rating: 4.3,
            workingHours: "8:30 AM - 6:30 PM",
            workingDays: "Mon - Sat",
            vehicleTypes: "Petrol, Diesel, EV",
            pickupDrop: "Available",
            services: "Engine Diagnostics, AC Repair",
            whatsapp: "919876543216"
        }
    ];

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
    const [filteredCenters, setFilteredCenters] = useState(centers);

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

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query) {
            setFilteredCenters(centers);
            return;
        }

        const filtered = centers.filter(center =>
            center.name.toLowerCase().includes(query.toLowerCase()) ||
            center.address.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredCenters(filtered);
    };

    const handleUseMyLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    const sortedCenters = centers.map(center => {
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

            filteredCenters.forEach(center => {
                const marker = new window.google.maps.Marker({
                    position: { lat: center.lat, lng: center.lng },
                    map: map,
                    title: center.name,
                    animation: window.google.maps.Animation.DROP
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
                    <h1 className="text-4xl font-bold text-[#011023] mb-4">Locate Us</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">Locate your nearest VehicleeCare center for premium service.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-4.5 h-[680px]">
                    {/* Right Column: Map */}
                    <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden relative shadow-lg border border-white/50 group h-full">
                        <div ref={mapRef} className="w-full h-full bg-gray-100"></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <p className="text-gray-500 animate-pulse">Loading Map...</p>
                            </div>
                        )}
                    </div>

                    {/* Left Column: Search & List */}
                    <div className="lg:col-span-1 flex flex-col gap-5 h-full pr-0.5 min-h-0">
                        {/* Search Bar */}
                        <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Enter Zip Code or City"
                                    className="w-full pl-10 pr-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/50 text-[#011023]"
                                />
                            </div>
                            <button
                                onClick={handleUseMyLocation}
                                className="w-full flex items-center justify-center gap-2 bg-[#052558] text-white py-2 rounded-lg font-medium hover:bg-[#052558]/90 transition-colors"
                            >
                                <Navigation size={18} />
                                Use My Current Location
                            </button>
                        </div>

                        {/* Centers List */}
                        <div className="flex-1 overflow-y-auto pr-0.5 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                            {filteredCenters.map((center, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedCenter(center)}
                                    className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-all cursor-pointer group hover:bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-[#011023] group-hover:text-[#527FB0] transition-colors">{center.name}</h3>
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">{center.distance}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                        <p>{center.address}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-1.5 border-t border-gray-100">
                                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                            <Clock size={12} /> {center.status}
                                        </span>
                                        <a href="#" className="text-xs font-bold text-[#052558] flex items-center gap-1 hover:underline">
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
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedCenter(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-[#011023] mb-2">{selectedCenter.name}</h2>
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

                        <div className="mt-8 flex flex-col sm:flex-row gap-3">

                            <button className="flex-1 bg-[#052558] text-white py-3 rounded-xl font-medium hover:bg-[#052558]/90 transition-colors flex items-center justify-center gap-2">
                                <Navigation size={18} />
                                Directions
                            </button>
                            <button className="flex-1 bg-white border-2 border-[#052558] text-[#052558] py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <Phone size={18} />
                                Call
                            </button>
                            <button className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-medium hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-2">
                                <MessageCircle size={18} />
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Locate;
