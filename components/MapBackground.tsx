import React from 'react';
import { motion } from 'framer-motion';

const MapBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden pointer-events-none z-0">
      
      {/* Base Texture Image (Replaces plain color for depth) */}
      <img 
        src="https://images.unsplash.com/photo-1624321614741-6535561a38a3?q=80&w=2070&auto=format&fit=crop"
        alt="Map Texture"
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay grayscale"
      />

      {/* Base Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-600"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Topographic Lines / Abstract Shapes */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        {/* Smoother transition for the path */}
        <motion.path 
          d="M0,100 Q400,300 800,100 T1600,100" 
          fill="none" 
          stroke="white" 
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        {/* Smoother circle animation using repeatType: mirror to avoid jump */}
        <motion.circle 
            cx="80%" 
            cy="30%" 
            r="200" 
            stroke="white" 
            strokeWidth="0.5" 
            fill="none" 
            initial={{ scale: 0.9, opacity: 0.1 }}
            animate={{ scale: 1.1, opacity: 0.3 }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </svg>

      {/* Animated Fog / Clouds - Smoother speed */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0), rgba(2, 6, 23, 0.9))',
        }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};

export default MapBackground;