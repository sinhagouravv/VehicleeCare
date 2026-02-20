import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f9ff] via-[#e6f0fa] to-[#f4f9ff] flex text-[#011023] font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-emerald-200/15 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col ml-64 relative z-10 h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                    {/* Content Outlet */}
                    <div className="max-w-7xl mx-auto relative z-10 relative">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
