import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';

const Customers = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const storedUser = localStorage.getItem('garageUser');
                if (!storedUser) return;
                const user = JSON.parse(storedUser);

                const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    // Extract unique customers
                    const customerMap = {};
                    data.data.forEach(b => {
                        if (!b.user || !b.user.name) return; // Skip if no user data
                        
                        const emailOrPhone = b.user.email || b.user.phone || 'Unknown';
                        const key = b.user.id || emailOrPhone;
                        
                        if (!customerMap[key]) {
                            customerMap[key] = {
                                id: key,
                                name: b.user.name,
                                email: b.user.email || 'N/A',
                                phone: b.user.phone || 'N/A',
                                vehicles: new Set(),
                                totalSpent: 0,
                                lastVisitDate: new Date(0) // Start with old date
                            };
                        }
                        
                        // Add vehicle
                        if (b.vehicle && b.vehicle.number) {
                            customerMap[key].vehicles.add(b.vehicle.number);
                        }

                        // Add spent amount
                        const amount = parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0;
                        if (b.status === 'Completed') {
                            customerMap[key].totalSpent += amount;
                        }

                        // Update last visit date
                        const defaultDate = new Date(b.schedule?.date || b.createdAt);
                        if (!isNaN(defaultDate.getTime()) && defaultDate > customerMap[key].lastVisitDate) {
                            customerMap[key].lastVisitDate = defaultDate;
                        }
                    });

                    // Convert map to array and format
                    const formattedCustomers = Object.values(customerMap).map(c => ({
                        ...c,
                        vehicles: c.vehicles.size,
                        lastVisit: c.lastVisitDate.getTime() === 0 ? 'Unknown' : c.lastVisitDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                    })).sort((a, b) => b.lastVisitDate - a.lastVisitDate);

                    setCustomers(formattedCustomers);
                }
            } catch (error) {
                console.error("Failed to fetch garage customers", error);
            } finally {
                setLoading(false);
                setLastRefreshed(new Date());
            }
        };

        fetchCustomers();
        const timer = setInterval(fetchCustomers, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight flex items-center gap-3">
                    Customers
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex justify-between items-center bg-white/40">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search customers by name, phone, or email..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {loading ? (
                        <div className="col-span-full text-center py-10 text-gray-500">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-400">No customers found.</div>
                    ) : customers.map((customer) => (
                        <div key={customer.id} className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-[#011023] opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={18} />
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl">
                                    {customer.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#011023] text-lg leading-tight truncate max-w-[150px]" title={customer.name}>{customer.name}</h3>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {customer.vehicles} Vehicle{customer.vehicles > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail size={14} className="text-gray-400" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{customer.phone}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-[#e6f0fa] flex justify-between items-center bg-gray-50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
                                    <p className="text-sm font-black text-[#011023]">₹{customer.totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Visit</p>
                                    <p className="text-sm font-bold text-gray-600">{customer.lastVisit}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Customers;
