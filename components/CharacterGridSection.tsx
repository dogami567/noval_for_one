import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Character } from '../types';

interface CharacterGridSectionProps {
  characters: Character[];
  activeLocationId: string | null;
  activeLocationName: string | null;
  onClearFilter: () => void;
  onSelectCharacter: (char: Character) => void;
}

const CharacterGridSection: React.FC<CharacterGridSectionProps> = ({
  characters,
  activeLocationId,
  activeLocationName,
  onClearFilter,
  onSelectCharacter,
}) => {
  return (
    <div className="w-full bg-slate-950 relative z-20 pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-12">
        
        {/* Section Header */}
        <div className="py-24 text-center">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="flex justify-center mb-4"
           >
              <div className="w-1 h-16 bg-gradient-to-b from-transparent to-amber-500"></div>
           </motion.div>
           <motion.h2 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="text-5xl text-amber-100 font-bold fantasy-font mb-4 tracking-wider"
           >
             The Champions
           </motion.h2>
           <p className="text-slate-500 uppercase tracking-[0.3em] text-sm">Legends of Aetheria</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-10 flex items-center justify-between gap-4 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 px-6 py-3 shadow-2xl">
          {activeLocationId ? (
            <div className="text-sm text-slate-200">
              Showing champions at{' '}
              <span className="text-amber-300 fantasy-font">
                {activeLocationName ?? 'Unknown Location'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-200">All Champions</div>
          )}
          {activeLocationId && (
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest bg-black/40 hover:bg-black/70 border border-white/10 hover:border-white/20 text-white transition-all"
            >
              Show All
            </button>
          )}
        </div>

        {characters.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur px-8 py-16 text-center shadow-xl">
            <p className="text-slate-300 text-sm tracking-wide">
              No champions are currently here.
            </p>
            {activeLocationId && (
              <button
                type="button"
                onClick={onClearFilter}
                className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest bg-black/50 hover:bg-black/80 border border-white/10 hover:border-white/20 text-white transition-all"
              >
                Show All
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((char, index) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onClick={() => onSelectCharacter(char)}
                className="group relative cursor-pointer h-[400px] overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-500"
              >
                {/* Image Container */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0 grayscale-[0.3]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>

                {/* Card Decoration Frame (League Style) */}
                <div className="absolute inset-4 border border-white/5 group-hover:border-amber-500/30 transition-colors duration-500 pointer-events-none z-10 flex flex-col justify-between">
                  <div className="w-full flex justify-between">
                    <div className="w-2 h-2 border-t border-l border-white/20 group-hover:border-amber-500/50"></div>
                    <div className="w-2 h-2 border-t border-r border-white/20 group-hover:border-amber-500/50"></div>
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-2 h-2 border-b border-l border-white/20 group-hover:border-amber-500/50"></div>
                    <div className="w-2 h-2 border-b border-r border-white/20 group-hover:border-amber-500/50"></div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 text-center z-20 transform group-hover:-translate-y-2 transition-transform duration-500">
                  {/* Icon Hexagon */}
                  <div className="mx-auto w-10 h-10 mb-4 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950 rotate-45 border border-amber-600/50 group-hover:border-amber-500 group-hover:bg-amber-900/20 transition-colors"></div>
                    <Shield size={14} className="relative z-10 text-amber-500" />
                  </div>

                  <h3 className="text-xl text-slate-200 font-bold fantasy-font tracking-wide mb-1 group-hover:text-white transition-colors">
                    {char.name}
                  </h3>
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-widest opacity-80 group-hover:text-amber-400 group-hover:opacity-100 transition-all">
                    {char.title}
                  </p>

                  {/* Hidden description on hover */}
                  <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-4 transition-all duration-500 opacity-0 group-hover:opacity-100">
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {char.description}
                    </p>
                    <span className="inline-block mt-3 text-amber-500 text-xs border-b border-amber-500/50 pb-0.5">
                      Read Lore
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterGridSection;
