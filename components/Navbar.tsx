import React from 'react';
import { Globe, BookOpen, Users } from 'lucide-react';
import { ViewType } from '../types';

interface NavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const navItems: { label: string; icon: React.ReactNode; id: ViewType }[] = [
    { label: '地图', icon: <Globe size={18} />, id: 'map' },
    { label: '英雄', icon: <Users size={18} />, id: 'characters' },
    { label: '编年史', icon: <BookOpen size={18} />, id: 'chronicles' },
  ];

  return (
    <div className="fixed top-0 left-0 w-full z-30 flex justify-center pt-6 pointer-events-none mix-blend-difference sm:mix-blend-normal">
      <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex gap-8 shadow-2xl transition-all hover:bg-slate-900/95">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-2 text-sm font-medium transition-all duration-300 relative group
                ${isActive 
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                  : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              {item.icon}
              <span className="fantasy-font tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;
