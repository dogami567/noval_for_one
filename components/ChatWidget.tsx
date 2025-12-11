import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { generateChronicleResponse } from '../services/geminiService';
import { ChatMessage, Location } from '../types';
import { INITIAL_WELCOME_MESSAGE } from '../constants';

interface ChatWidgetProps {
  selectedLocation: Location | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ selectedLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: INITIAL_WELCOME_MESSAGE, timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const context = selectedLocation 
      ? `Selected Location: ${selectedLocation.name} (${selectedLocation.type}). Description: ${selectedLocation.description}. Lore: ${selectedLocation.lore}` 
      : '';

    const aiText = await generateChronicleResponse(userMsg.text, context);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                   <Bot size={18} className="text-cyan-400" />
                </div>
                <span className="font-semibold text-slate-100 fantasy-font">Chronicle Keeper</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-br-none' 
                      : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-none'}
                  `}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-slate-800/50 p-3 rounded-2xl rounded-bl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the history..."
                  className="w-full bg-slate-800/50 text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-transparent placeholder-slate-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors
          ${isOpen ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400 border border-cyan-500/50'}
        `}
      >
        {/* Breathing Glow Effect */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md z-[-1]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;