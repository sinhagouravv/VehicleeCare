import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Navigation, Phone, Clock, X, Star, Car, Wrench, CircleDollarSign, MessageCircle, Calendar } from 'lucide-react';

const Locate = () => {
    const mapRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);

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
        if (window.google && window.google.maps) {
            setMapLoaded(true);
            return;
        }

        const existingScript = document.getElementById('google-maps-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'google-maps-script';
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            script.src = apiKey && apiKey !== 'undefined'
                ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
                : `https://maps.googleapis.com/maps/api/js`;
            script.async = true;
            script.defer = true;
            script.onload = () => setMapLoaded(true);
            document.head.appendChild(script);
        } else {
            existingScript.addEventListener('load', () => setMapLoaded(true));
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

            if (filteredCenters.length > 0) {
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
            }

            // Adjust map to fit the symmetrical bounds
            map.fitBounds(bounds);

            // Prevent zooming in too much when there is no data
            const listener = window.google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 10) map.setZoom(10);
                window.google.maps.event.removeListener(listener);
            });
        }
    }, [mapLoaded, filteredCenters]);

    return (
        <div className="bg-gradient-to-br from-white via-blue-50 to-white h-[100vh] overflow-hidden flex items-center py-15 relative">
            {/* Background Decorations */}
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/50 blur-3xl rounded-full pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 mt-8 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-center">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#011023] mb-4">Locate Us</h1>
                    {/* <p className="text-gray-600 max-w-2xl mx-auto">Locate your nearest VehicleeCare center for premium service.</p> */}
                </div>

                <div className="h-[780px]">
                    {/* Right Column: Map */}
                    <div className="bg-white rounded-2xl overflow-hidden relative shadow-lg border border-white/50 group h-full">
                        <div ref={mapRef} className="w-full h-full bg-gray-100"></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <p className="text-gray-500 animate-pulse">Loading Map...</p>
                            </div>
                        )}
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
