import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Castle, Mountain, Trees, Lock, Navigation } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Location } from '../types';

interface MapMarkerProps {
  location: Location;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: (location: Location) => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ location, isSelected, isCurrent, onClick }) => {
  const isLocked = location.status === 'locked';

  // Determine icon based on type and status
  const getIcon = () => {
    if (isLocked) return <Lock size={16} />;
    switch (location.type) {
      case 'city': return <Castle size={20} />;
      case 'nature': return <Trees size={20} />;
      case 'ruin': return <Mountain size={20} />;
      case 'mystic': return <MapPin size={20} />;
      default: return <MapPin size={20} />;
    }
  };

  const typePalette = {
    mystic: {
      main: 'text-cyan-200',
      bg: 'bg-slate-900/80 border-cyan-500',
      pulse: 'border-purple-400',
      glow: 'bg-purple-500/30',
      accentBorder: 'border-cyan-500/30',
    },
    nature: {
      main: 'text-emerald-200',
      bg: 'bg-emerald-900/70 border-emerald-500',
      pulse: 'border-emerald-400',
      glow: 'bg-emerald-500/30',
      accentBorder: 'border-emerald-500/30',
    },
    city: {
      main: 'text-amber-200',
      bg: 'bg-amber-900/70 border-amber-500',
      pulse: 'border-amber-400',
      glow: 'bg-amber-500/30',
      accentBorder: 'border-amber-500/30',
    },
    ruin: {
      main: 'text-rose-200',
      bg: 'bg-rose-900/70 border-rose-500',
      pulse: 'border-rose-400',
      glow: 'bg-rose-500/30',
      accentBorder: 'border-rose-500/30',
    },
  } as const;

  const palette = typePalette[location.type] ?? typePalette.mystic;

  let mainColor = palette.main;
  let bgColor = palette.bg;
  let pulseColor = palette.pulse;
  let glowColor = palette.glow;
  let accentBorder = palette.accentBorder;

  if (isLocked) {
    mainColor = 'text-slate-400';
    bgColor = 'bg-slate-800/90 border-slate-600';
    pulseColor = 'border-slate-600';
    glowColor = 'bg-slate-500/10';
    accentBorder = 'border-slate-700';
  } else if (isSelected && !isCurrent) {
    mainColor = 'text-white';
    bgColor = twMerge(bgColor, 'border-white');
    pulseColor = 'border-white/80';
  }

  return (
    <div 
      className="absolute z-10 cursor-pointer group"
      style={{ left: `${location.x}%`, top: `${location.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(location);
      }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-20 h-20">
        
        {/* CURRENT LOCATION INDICATOR (Rotating Ring) */}
        {isCurrent && (
            <motion.div
                className="absolute inset-0 rounded-full border border-dashed border-amber-500/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ width: '140%', height: '140%', left: '-20%', top: '-20%' }}
            />
        )}

        {/* PULSING RING (Smooth Animation) */}
        {!isLocked && (
          <motion.div
            className={`absolute inset-0 rounded-full border ${pulseColor}`}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0.2, 0.9] }}
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* STATIC GLOW */}
        <div className={`absolute w-12 h-12 rounded-full blur-md transition-colors duration-500 ${glowColor}`}></div>

        {/* CORE MARKER */}
        <motion.div
          className={twMerge(
            'relative z-20 w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-colors duration-300 shadow-lg',
            bgColor,
            mainColor
          )}
          whileHover={!isLocked ? { scale: 1.15 } : { scale: 1.05 }}
          whileTap={!isLocked ? { scale: 0.95 } : {}}
          layoutId={`marker-${location.id}`}
        >
          {getIcon()}
          
          {/* Current Location Badge Icon overlay */}
          {isCurrent && (
             <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black rounded-full p-0.5 border border-black">
                <Navigation size={8} className="rotate-45" />
             </div>
          )}
        </motion.div>

        {/* HOVER LABEL / YOU ARE HERE LABEL */}
        <div
          className={twMerge(
            'absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 flex flex-col items-center gap-1 transition-opacity duration-300 pointer-events-none',
            isCurrent || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isCurrent && (
            <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase animate-pulse">
              Current Location
            </span>
          )}
          <div
            className={twMerge(
              'px-3 py-1.5 rounded border backdrop-blur-md shadow-xl text-xs fantasy-font tracking-wide',
              isLocked ? 'bg-slate-900/90 text-slate-400 border-slate-700' : 'bg-black/90 text-white',
              !isLocked ? accentBorder : ''
            )}
          >
            {location.name} {isLocked && '(Locked)'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapMarker;
