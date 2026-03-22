import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 flex flex-col p-6 gap-8 backdrop-blur-3xl bg-white/[0.02]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black">VC</span>
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">Employee</span>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
            <NavItem icon={<Users size={20} />} label="Tasks" />
            <NavItem icon={<Settings size={20} />} label="Settings" />
          </nav>

          <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors uppercase text-xs font-bold tracking-widest mt-auto">
            <LogOut size={18} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto hide-scrollbar">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight uppercase">Dashboard</h1>
              <p className="text-slate-400 mt-2 text-sm font-medium">Welcome back to the employee portal.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 px-6 py-3">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Employee ID</p>
                <p className="text-sm font-black text-blue-400">EMP-9021</p>
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-full border border-white/10" />
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard title="Total Assigned" value="12" unit="Tasks" />
            <StatsCard title="In Progress" value="03" unit="Active" />
            <StatsCard title="Completed" value="09" unit="Total" accent="bg-emerald-500" />
          </div>
        </main>
      </div>
    </Router>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-bold uppercase text-[11px] tracking-widest ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
    {icon} {label}
  </a>
);

const StatsCard = ({ title, value, unit, accent = "bg-blue-500" }) => (
  <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-500 group">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{title}</p>
    <div className="flex items-baseline gap-3">
      <span className="text-6xl font-black tabular-nums tracking-tighter">{value}</span>
      <span className="text-sm font-bold uppercase text-slate-500">{unit}</span>
    </div>
    <div className={`h-1 w-12 ${accent} mt-6 rounded-full group-hover:w-24 transition-all duration-500 opacity-60`} />
  </div>
);

export default App;
