import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f9ff] via-[#e6f0fa] to-[#f4f9ff] flex text-[#011023] font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-3xl opacity-40 transform-gpu pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-emerald-200/15 rounded-full blur-3xl opacity-40 transform-gpu pointer-events-none"></div>

            {/* Sidebar */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col relative z-10 h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-[5.5rem]' : 'ml-[16.75rem]'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto p-8 hide-scrollbar relative">
                    {/* Content Outlet */}
                    <div className="relative z-10 w-full h-full border border-transparent">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
