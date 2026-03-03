import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, Zap, Car, MapPin, ArrowRight,
    CarFront, Truck, Bus, Bike, Tractor, TrainFront,
    CableCar, CarTaxiFront, Caravan, Plane, Ship,
    Rocket, Helicopter, TramFront, BusFront
} from 'lucide-react';
import { FloatingIconsHero } from '../components/ui/floating-icons-hero-section';
import Pricing from './Pricing';
import Locate from './Locate';
import Reviews from './Reviews';
import Contact from './Contact';
import Business from './Business';
import Benefits from './Benefits';

const demoIcons = [
    { id: 1, icon: CarFront, className: 'top-[15%] left-[10%]', color: 'text-blue-500' },
    { id: 2, icon: Truck, className: 'top-[25%] right-[10%]', color: 'text-red-500' },
    { id: 3, icon: Bus, className: 'top-[80%] left-[15%]', color: 'text-amber-500' },
    { id: 4, icon: Bike, className: 'bottom-[12%] right-[15%]', color: 'text-emerald-500' },
    { id: 5, icon: Tractor, className: 'top-[10%] left-[35%]', color: 'text-orange-500' },
    { id: 6, icon: TrainFront, className: 'top-[8%] right-[35%]', color: 'text-indigo-500' },
    { id: 7, icon: CableCar, className: 'bottom-[15%] left-[30%]', color: 'text-cyan-500' },
    { id: 8, icon: CarTaxiFront, className: 'top-[45%] left-[8%]', color: 'text-yellow-500' },
    { id: 9, icon: Caravan, className: 'top-[70%] right-[8%]', color: 'text-teal-500' },
    { id: 10, icon: Plane, className: 'top-[85%] left-[65%]', color: 'text-sky-500' },
    { id: 11, icon: Ship, className: 'top-[50%] right-[6%]', color: 'text-blue-700' },
    { id: 12, icon: Rocket, className: 'top-[55%] left-[20%]', color: 'text-purple-500' },
    { id: 13, icon: Helicopter, className: 'top-[8%] left-[75%]', color: 'text-rose-500' },
    { id: 14, icon: TramFront, className: 'bottom-[8%] right-[40%]', color: 'text-lime-600' },
    { id: 15, icon: BusFront, className: 'top-[35%] right-[22%]', color: 'text-fuchsia-500' },
    { id: 16, icon: Car, className: 'top-[65%] left-[35%]', color: 'text-zinc-600' },
];

const Home = () => {
    const [hasActiveSub, setHasActiveSub] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('businessUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.subscriptionStatus === 'active') {
                setHasActiveSub(true);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-white">

            {/* Hero Section */}
            <FloatingIconsHero
                id="home"
                title={
                    <h1 className="text-3xl md:text-5xl font-black text-[#011023] tracking-tight leading-[1.1]">
                        GROW YOUR BUSINESS <br className="hidden md:block" />
                        <span className="relative inline-block mt-2">
                            <span className="relative z-10 text-xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#052558] via-blue-600 to-[#527FB0]">
                                with VehicleeCare
                            </span>
                            <div className="absolute -bottom-2 left-0 w-full h-4 bg-blue-100/50 -rotate-1 rounded-full blur-[2px] -z-10" />
                        </span>
                    </h1>
                }
                subtitle="Join thousands of garages, charging stations, and part stores leveraging the VehicleeCare network to reach more customers and manage operations effortlessly."
                ctaText="Start Selling Today"
                ctaHref="/register"
                icons={demoIcons}
            />

            {/* Injected Sections */}
            <Business />
            <Benefits />
            {!hasActiveSub && <div id="pricing"><Pricing /></div>}
            <div id="locate"><Locate /></div>
            <div id="reviews"><Reviews /></div>
            <div id="contact"><Contact /></div>

        </div>
    );
};

// Mock missing icons to avoid imports failing immediately
// const Users = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
// const TrendingUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
// const ShieldCheck = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>;

export default Home;
