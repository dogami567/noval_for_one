import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Clock, CheckCircle, Circle } from 'lucide-react';
import { ChronicleEntry } from '../types';

interface ChroniclesViewProps {
  entries: ChronicleEntry[];
  isLoading?: boolean;
}

const ChroniclesView: React.FC<ChroniclesViewProps> = ({ entries, isLoading = false }) => {
  const isAdminMode = import.meta.env.VITE_ADMIN_MODE === 'true';
  const [localEntries, setLocalEntries] = useState<ChronicleEntry[]>(entries);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<ChronicleEntry>>({ title: '', summary: '', date: 'Era 4, Year 205' });

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const handleAddEntry = () => {
    if (newEntry.title && newEntry.summary) {
      const entry: ChronicleEntry = {
        id: `entry_${Date.now()}`,
        title: newEntry.title,
        summary: newEntry.summary,
        date: newEntry.date || 'Unknown Date',
        status: 'active'
      };
      setLocalEntries([entry, ...localEntries]);
      setIsAdding(false);
      setNewEntry({ title: '', summary: '', date: 'Era 4, Year 205' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'active': return <Clock size={16} className="text-amber-500" />;
      default: return <Circle size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="w-full px-4 sm:px-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-12">
           <div>
              <h2 className="text-4xl text-amber-400 font-bold fantasy-font drop-shadow-lg">The Living Chronicle</h2>
              <p className="text-slate-400 italic mt-2">The tapestry of fate, woven by your choices.</p>
           </div>
           {isAdminMode && (
             <button 
               onClick={() => setIsAdding(!isAdding)}
               className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
             >
               <Plus size={18} />
               <span className="font-semibold">Add Plot Event</span>
             </button>
           )}
        </div>

        {/* New Entry Form */}
        <AnimatePresence>
          {isAdminMode && isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900/80 border border-amber-500/30 rounded-lg p-6 mb-8 overflow-hidden"
            >
              <h3 className="text-lg text-amber-200 mb-4 font-serif">Inscribe New History</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Event Title"
                  value={newEntry.title}
                  onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Date / Era"
                  value={newEntry.date}
                  onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                />
                <textarea 
                  placeholder="Description of the event..."
                  value={newEntry.summary}
                  onChange={e => setNewEntry({...newEntry, summary: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button onClick={handleAddEntry} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2">
                    <Save size={16} /> Save Record
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="relative border-l-2 border-slate-700 ml-4 space-y-8 pl-8">
          {isLoading && localEntries.length === 0 && (
            <div className="text-slate-500 text-sm italic">Loading chronicles...</div>
          )}
          {localEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-slate-900/50 border border-slate-700/50 p-6 rounded-lg hover:border-slate-500 transition-colors"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center">
                 <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <div>
                   <span className="text-xs text-cyan-400 uppercase tracking-wider font-bold">{entry.date}</span>
                   <h3 className="text-xl text-slate-100 font-bold font-serif">{entry.title}</h3>
                </div>
                <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded text-xs text-slate-300 border border-white/5">
                   {getStatusIcon(entry.status)}
                   <span className="uppercase">{entry.status}</span>
                </div>
              </div>
              
              <p className="text-slate-400 leading-relaxed text-sm">
                {entry.summary}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ChroniclesView;
