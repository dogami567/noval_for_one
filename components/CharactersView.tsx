import React from 'react';
import { motion } from 'framer-motion';
import { CHARACTERS } from '../constants';

const CharactersView: React.FC = () => {
  return (
    <div className="pt-24 px-4 sm:px-12 pb-12 w-full h-full overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl text-amber-400 font-bold fantasy-font mb-2 drop-shadow-lg text-center">Hall of Heroes</h2>
        <p className="text-slate-400 text-center mb-12 italic max-w-2xl mx-auto">
          "History is written by the victors, but legend is forged by the brave."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CHARACTERS.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors group"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={char.imageUrl} 
                  alt={char.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <div className="absolute bottom-2 left-4">
                  <span className="text-xs uppercase tracking-widest text-amber-500 font-bold bg-black/60 px-2 py-1 rounded">
                    {char.faction}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl text-slate-100 font-serif font-bold mb-1">{char.name}</h3>
                <p className="text-sm text-amber-600/80 mb-4 font-semibold uppercase tracking-wide">{char.title}</p>
                <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
                  {char.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CharactersView;