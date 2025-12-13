import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Paperclip, FileText } from 'lucide-react';
import { generateChronicleResponse } from '../services/geminiService';
import { ChatMessage, Place } from '../types';
import { INITIAL_WELCOME_MESSAGE } from '../constants';

interface ChatWidgetProps {
  selectedLocation: Place | null;
}

type AttachmentKind = 'image' | 'text';

interface PendingAttachment {
  key: string;
  kind: AttachmentKind;
  file: File;
  contentType: string;
  previewUrl?: string;
}

interface SentAttachment {
  kind: AttachmentKind;
  filename: string;
  contentType: string;
  size: number;
  previewUrl?: string;
  truncated?: boolean;
}

type UiChatMessage = ChatMessage & { attachments?: SentAttachment[] };

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_CHARS = 8000;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
};

const inferTextContentType = (file: File): string | null => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md')) return 'text/markdown';
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.txt')) return 'text/plain';
  return null;
};

const classifyAttachment = (file: File): { kind: AttachmentKind; contentType: string } | null => {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') {
    return { kind: 'image', contentType: type };
  }

  if (type === 'text/plain' || type === 'text/markdown' || type === 'application/json') {
    return { kind: 'text', contentType: type };
  }

  const inferred = inferTextContentType(file);
  if (inferred) {
    return { kind: 'text', contentType: inferred };
  }

  return null;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const parts = result.split(',');
        resolve(parts[1] || '');
      } else {
        resolve('');
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const ChatWidget: React.FC<ChatWidgetProps> = ({ selectedLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UiChatMessage[]>([
    { id: 'init', role: 'model', text: INITIAL_WELCOME_MESSAGE, timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handlePickAttachments = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentsSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setPendingAttachments((prev) => {
      const existingKeys = new Set(prev.map((a) => a.key));
      let totalBytes = prev.reduce((sum, a) => sum + a.file.size, 0);
      const next = [...prev];
      const errors: string[] = [];

      for (const file of files) {
        const classified = classifyAttachment(file);
        if (!classified) {
          errors.push(`已忽略不支持的附件：${file.name}`);
          continue;
        }

        if (file.size > MAX_ATTACHMENT_BYTES) {
          errors.push(`已忽略过大的附件：${file.name}（> 2MB）`);
          continue;
        }

        if (totalBytes + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
          errors.push('附件总大小不能超过 4MB');
          break;
        }

        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);

        const previewUrl =
          classified.kind === 'image' ? URL.createObjectURL(file) : undefined;

        next.push({
          key,
          kind: classified.kind,
          file,
          contentType: classified.contentType,
          previewUrl,
        });
        totalBytes += file.size;
      }

      setAttachmentError(errors.length > 0 ? errors.join('；') : null);
      return next;
    });
  };

  const handleRemoveAttachment = (key: string) => {
    setPendingAttachments((prev) => {
      const target = prev.find((a) => a.key === key);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.key !== key);
    });
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && pendingAttachments.length === 0) return;

    const context = selectedLocation 
      ? `Selected Place: ${selectedLocation.name} (${selectedLocation.kind}). Description: ${selectedLocation.description}. Lore: ${selectedLocation.loreMd}` 
      : '';

    const history = messages
      .filter((m) => m.id !== 'init')
      .filter((m) => m.role === 'user' || m.role === 'model')
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    const userText = trimmedInput || (pendingAttachments.length > 0 ? '请阅读附件并回答。' : '');

    let attachmentsPayload:
      | Array<
          | { kind: 'image'; filename: string; contentType: string; base64: string }
          | { kind: 'text'; filename: string; contentType: string; text: string }
        >
      | undefined;

    let messageAttachments: SentAttachment[] | undefined;

    if (pendingAttachments.length > 0) {
      try {
        const results = await Promise.all(
          pendingAttachments.map(async (att) => {
            if (att.kind === 'image') {
              const base64 = await readFileAsBase64(att.file);
              return {
                payload: {
                  kind: 'image' as const,
                  filename: att.file.name,
                  contentType: att.contentType,
                  base64,
                },
                sent: {
                  kind: 'image' as const,
                  filename: att.file.name,
                  contentType: att.contentType,
                  size: att.file.size,
                  previewUrl: att.previewUrl,
                },
              };
            }

            const rawText = await att.file.text();
            const truncated = rawText.length > MAX_TEXT_CHARS;
            const text = rawText.slice(0, MAX_TEXT_CHARS);
            return {
              payload: {
                kind: 'text' as const,
                filename: att.file.name,
                contentType: att.contentType || 'text/plain',
                text,
              },
              sent: {
                kind: 'text' as const,
                filename: att.file.name,
                contentType: att.contentType || 'text/plain',
                size: att.file.size,
                truncated,
              },
            };
          })
        );

        attachmentsPayload = results.map((r) => r.payload);
        messageAttachments = results.map((r) => r.sent);
      } catch (err: any) {
        setAttachmentError(`读取附件失败：${err?.message ?? '未知错误'}`);
      }
    }

    const userMsg: UiChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      attachments: messageAttachments,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setPendingAttachments([]);
    setIsTyping(true);

    const aiText = await generateChronicleResponse(userText, context, history, attachmentsPayload);

    const aiMsg: UiChatMessage = {
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
            className="mb-4 w-80 sm:w-96 h-[500px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                   <Bot size={18} className="text-cyan-400" />
                </div>
                <span className="font-semibold text-slate-100 fantasy-font">编年史守护者</span>
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
                    <div>{msg.text}</div>
                    {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.some((a) => a.kind === 'image') && (
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments
                              .filter((a) => a.kind === 'image')
                              .map((a) => (
                                <button
                                  key={`img-${msg.id}-${a.filename}`}
                                  type="button"
                                  onClick={() => a.previewUrl && setImagePreview({ url: a.previewUrl, name: a.filename })}
                                  className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 border border-white/10"
                                  title="点击放大"
                                >
                                  {a.previewUrl ? (
                                    <img
                                      src={a.previewUrl}
                                      alt={a.filename}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/70">
                                      图片
                                    </div>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                        {msg.attachments.some((a) => a.kind === 'text') && (
                          <div className="text-xs text-white/90">
                            已附加：
                            {msg.attachments
                              .filter((a) => a.kind === 'text')
                              .map((a) => a.filename + (a.truncated ? '（已截断）' : ''))
                              .join('、')}
                          </div>
                        )}
                      </div>
                    )}
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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.txt,.md,.json,text/plain,text/markdown,application/json"
                onChange={handleAttachmentsSelected}
                className="hidden"
              />

              {pendingAttachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingAttachments.map((att) => (
                    <div
                      key={att.key}
                      className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-2 py-1"
                    >
                      {att.kind === 'image' && att.previewUrl ? (
                        <img
                          src={att.previewUrl}
                          alt={att.file.name}
                          className="w-12 h-12 rounded-lg object-cover bg-black/20 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-900/60 border border-white/10 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-slate-100 truncate max-w-[160px]">
                          {att.file.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {att.kind === 'image' ? '图片' : '文本'} · {formatBytes(att.file.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.key)}
                        className="ml-1 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center"
                        title="移除"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attachmentError && (
                <div className="mb-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2 py-1">
                  {attachmentError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePickAttachments}
                  disabled={isTyping}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 text-slate-200 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="附件"
                >
                  <Paperclip size={18} />
                </button>

                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="询问这片大陆的历史…"
                    className="w-full bg-slate-800/50 text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-transparent placeholder-slate-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isTyping || (!inputValue.trim() && pendingAttachments.length === 0)}
                    className="absolute right-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="发送"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
                  onClick={() => setImagePreview(null)}
                >
                  <div
                    className="relative max-w-full max-h-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={imagePreview.url}
                      alt={imagePreview.name}
                      className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl border border-white/10 bg-black/30"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
                      title="关闭"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
