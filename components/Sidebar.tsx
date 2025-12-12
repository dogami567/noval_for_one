import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, ScrollText, Edit2, Save, Map, Lock } from 'lucide-react';
import { Location } from '../types';

interface SidebarProps {
  location: Location | null;
  currentLocationId: string;
  onClose: () => void;
  onUpdate: (location: Location) => void;
  onTravel: () => void;
  onViewChampions: (location: Location) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ location, currentLocationId, onClose, onUpdate, onTravel, onViewChampions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({});
  const isAdminMode = import.meta.env.VITE_ADMIN_MODE === 'true';

  // Reset editing state when location changes
  useEffect(() => {
    setIsEditing(false);
    if (location) {
      setFormData(location);
    }
  }, [location]);

  const handleSave = () => {
    if (!isAdminMode) return;
    if (location && formData) {
      onUpdate({ ...location, ...formData } as Location);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (!isAdminMode) return;
    setIsEditing(false);
    if (location) {
      setFormData(location);
    }
  };

  if (!location) return null;

  const isLocked = location.status === 'locked';
  const isCurrentLocation = location.id === currentLocationId;
  const canTravel = !isLocked && !isCurrentLocation;

  return (
    <AnimatePresence>
      <motion.div
        key="sidebar"
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-full sm:w-[450px] z-40 p-4 sm:p-0"
      >
        <div className="h-full w-full bg-slate-900/95 backdrop-blur-xl border-r border-amber-500/20 shadow-[5px_0_50px_rgba(0,0,0,0.6)] flex flex-col sm:rounded-r-3xl overflow-hidden relative">
          
          {/* Background Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-40 mix-blend-overlay pointer-events-none"></div>

          {/* Header Image */}
          <div className="relative h-56 w-full shrink-0 overflow-hidden border-b border-amber-500/40 group">
            <img 
              src={location.imageUrl} 
              alt={location.name} 
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLocked ? 'grayscale' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/90 transition-colors backdrop-blur-md border border-white/10"
            >
              <X size={20} />
            </button>

            {!isEditing && isAdminMode && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute bottom-4 right-4 p-2 bg-amber-600/90 hover:bg-amber-500 rounded-full text-white shadow-lg border border-amber-400/50 transition-all hover:scale-105"
                title="Edit Details"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            
            {/* Type Tag */}
            <div>
              <div className="flex justify-between items-center mb-3">
                 <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.25em] flex items-center gap-2">
                    <Compass size={12} />
                    {location.type} location
                 </span>
                 {isLocked && (
                    <span className="text-slate-400 text-xs uppercase tracking-widest flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                       <Lock size={12} /> Locked
                    </span>
                 )}
              </div>

              {isAdminMode && isEditing ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Name</label>
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded p-2 text-white font-serif text-xl focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Brief Description</label>
                    <textarea 
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded p-2 text-slate-300 text-sm focus:border-amber-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Lore</label>
                    <textarea 
                      value={formData.lore || ''}
                      onChange={(e) => setFormData({...formData, lore: e.target.value})}
                      rows={5}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded p-2 text-slate-300 text-sm focus:border-amber-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-semibold transition-colors">
                       <Save size={16} /> Save Changes
                     </button>
                     <button onClick={handleCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
                       Cancel
                     </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className={`text-4xl text-white font-bold fantasy-font leading-tight mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isLocked ? 'text-slate-500' : ''}`}>
                    {location.name}
                  </h2>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-amber-500 to-transparent mb-6"></div>
                  <p className="text-slate-200 text-lg leading-relaxed font-light italic border-l-2 border-slate-600 pl-4">
                    "{location.description}"
                  </p>

                  <div className="space-y-4 pt-6">
                    <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-800 pb-2">
                      <ScrollText size={18} />
                      <span className="text-sm font-semibold uppercase tracking-widest">Archivist Notes</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-7 font-sans text-justify">
                      {isLocked ? "The records for this location are sealed or lost to time. Visit nearby locations to uncover clues." : location.lore}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-slate-800 bg-black/40 backdrop-blur-sm z-20">
            <button
              type="button"
              onClick={() => onViewChampions(location)}
              className="group w-full mb-3 py-3 px-6 font-semibold rounded-lg uppercase tracking-[0.18em] text-xs flex items-center justify-center gap-3 bg-slate-800/70 hover:bg-slate-700 text-white border border-white/10 hover:border-white/20 transition-all"
            >
              View Champions Here
            </button>
            <button 
              onClick={onTravel}
              disabled={!canTravel}
              className={`
                group w-full py-4 px-6 font-bold rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3
                ${canTravel 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
              `}
            >
              {isLocked ? <Lock size={18} /> : <Map size={18} className="group-hover:rotate-12 transition-transform" />}
              <span>
                {isLocked ? 'Location Locked' : isCurrentLocation ? 'You Are Here' : 'Travel to Location'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Sidebar;
