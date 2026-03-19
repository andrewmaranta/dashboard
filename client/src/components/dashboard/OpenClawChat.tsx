import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Zap, ZapOff, MessageSquare, Trash2, X, VolumeX, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { socket } from '../../services/api';

interface ChatMessage {
  text: string;
  sender: 'user' | 'agent';
  timestamp: number;
}

interface OpenClawChatProps {
  isOpen: boolean;
  onClose?: () => void;
  stopAudio?: () => void;
}

const ELEVENLABS_VOICES = [
  { id: 'MClEFoImJXBTgLwdLI5n', name: 'Ivy' },
  { id: '2ajXGJNYBR0iNHpS4VZb', name: 'Rob' },
  { id: 'si0svtk05vPEuvwAW93c', name: 'Blondie' },
  { id: 'USEQXnsXRJlw2k9LUzG4', name: 'Tess' },
  { id: 'MiueK1FXuZTCItgbQwPu', name: 'Maya' },
  { id: 'NOpBlnGInO9m6vDvFkFC', name: 'Spuds' },
];

export const OpenClawChat: React.FC<OpenClawChatProps> = ({ isOpen, onClose, stopAudio }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAgentMsg, setPendingAgentMsg] = useState<{text: string, timestamp: number} | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('openclaw_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [autoSend, setAutoSend] = useState(() => {
    return localStorage.getItem('openclaw_autosend') !== 'false';
  });
  const [ttsEngine, setTtsEngine] = useState(() => {
    return localStorage.getItem('openclaw_tts_engine') || 'openai';
  });
  const [ttsVoice, setTtsVoice] = useState(() => {
    return localStorage.getItem('openclaw_tts_voice') || ELEVENLABS_VOICES[0].id;
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const replayAudioRef = useRef<HTMLAudioElement>(null);

  const handleReplay = (msg: ChatMessage) => {
    if (msg.sender !== 'agent') return;
    
    // Stop any currently playing audio globally first
    stopAudio?.();

    if (replayAudioRef.current) {
      // Strip [tag] speech markers (like the server does for non-ElevenLabs, but good to be safe)
      const cleanText = msg.text.replace(/\[[a-zA-Z\s]+\](?!\()/g, '');
      const url = `/api/tts/stream?text=${encodeURIComponent(cleanText)}&engine=${ttsEngine}&voiceId=${ttsVoice}&t=${Date.now()}`;
      replayAudioRef.current.src = url;
      replayAudioRef.current.play().catch(e => console.error("Replay failed:", e));
    }
  };

  useEffect(() => {
    localStorage.setItem('openclaw_history', JSON.stringify(history.slice(-20)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('openclaw_tts_engine', ttsEngine);
  }, [ttsEngine]);

  useEffect(() => {
    localStorage.setItem('openclaw_tts_voice', ttsVoice);
  }, [ttsVoice]);

  const scrollToBottom = (instant = false) => {
    historyEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(true);
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Function to commit the pending message to history
  const commitPendingMessage = useCallback(() => {
    if (pendingAgentMsg) {
      const agentMsg: ChatMessage = { 
        text: pendingAgentMsg.text, 
        sender: 'agent', 
        timestamp: pendingAgentMsg.timestamp 
      };
      setHistory(prev => [...prev, agentMsg]);
      setPendingAgentMsg(null);
      setIsSending(false);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    }
  }, [pendingAgentMsg]);

  // Sync text with audio: listen for ttsPlay to show the pending message
  useEffect(() => {
    const handleTTS = () => {
      if (pendingAgentMsg) {
        // Add a small 600ms delay to ensure the voice has actually started audible playback
        setTimeout(commitPendingMessage, 600);
      }
    };

    socket.on('ttsPlay', handleTTS);
    return () => { socket.off('ttsPlay', handleTTS); };
  }, [pendingAgentMsg, commitPendingMessage]);

  // Fallback timeout: if TTS event doesn't arrive in 5s, show the message anyway
  useEffect(() => {
    if (pendingAgentMsg) {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = setTimeout(() => {
        console.log('TTS sync fallback triggered - showing message without audio event');
        commitPendingMessage();
      }, 5000);
    }
    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [pendingAgentMsg, commitPendingMessage]);

  // Handle Ctrl + Win focus even if chat is already open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.metaKey && isOpen) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [history, isSending]);

  const toggleAutoSend = () => {
    setAutoSend(prev => {
      const newVal = !prev;
      localStorage.setItem('openclaw_autosend', newVal.toString());
      return newVal;
    });
  };

  const clearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      setHistory([]);
      localStorage.removeItem('openclaw_history');
    }
  };

  const handleSend = useCallback(async (e?: React.FormEvent, msgOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = msgOverride || message;
    
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = { text: textToSend.trim(), sender: 'user', timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    
    setIsSending(true);
    const msgToSend = textToSend.trim();
    setMessage('');

    try {
      const res = await fetch('/api/openclaw/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, ttsEngine, voiceId: ttsVoice })
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      
      let textToDisplay = null;
      if (data.text) {
        textToDisplay = data.text;
      } else if (data.response?.result?.payloads?.[0]?.text) {
        textToDisplay = data.response.result.payloads[0].text;
      }
      
      if (textToDisplay) {
        setPendingAgentMsg({ text: textToDisplay, timestamp: Date.now() });
        // NOTE: isSending remains true until the TTS event or timeout triggers commitPendingMessage
      } else {
        setIsSending(false);
      }
      
    } catch (err) {
      console.error('Error sending message to OpenClaw:', err);
      const errorMsg: ChatMessage = { text: 'Ruby is unavailable. Check system logs.', sender: 'agent', timestamp: Date.now() };
      setHistory(prev => [...prev, errorMsg]);
      setIsSending(false);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [message, isSending]);

  useEffect(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (autoSend && message.trim() && !isSending) {
      // With native OS dictation or typing, simply send after a brief idle pause
      typingTimeoutRef.current = setTimeout(() => {
        handleSend(undefined, message);
      }, 1500);
    }
  }, [message, autoSend, isSending, handleSend]);

  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const stripSpeechTags = (text: string) => {
    // Strips [laughs], [sighs], etc. but preserves [text](url) links
    // The negative lookahead ensures we don't match Markdown links
    return text.replace(/\[[a-zA-Z\s]+\](?!\()/g, '');
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500 pointer-events-auto overflow-hidden"
      style={{ top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', width: '100vw' }}
    >
      <audio ref={replayAudioRef} className="hidden" />
      <div className="w-full max-w-2xl h-full sm:h-[85vh] bg-cozy-bg sm:rounded-[2.5rem] border-0 sm:border-2 border-cozy-border shadow-[0_30px_90px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 ease-out">
        
        {/* Messenger Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b-2 border-cozy-border bg-cozy-panel flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cozy-accent/10 border-2 border-cozy-accent/20 flex items-center justify-center text-cozy-accent">
              <MessageSquare size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-cozy-text-dark leading-tight">
                {ttsEngine === 'elevenlabs' 
                  ? ELEVENLABS_VOICES.find(v => v.id === ttsVoice)?.name || 'Ruby'
                  : ttsEngine === 'openai' ? 'Ruby' : 'Ruby'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cozy-text-dim opacity-60">AI Companion</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <select 
                value={ttsEngine}
                onChange={(e) => setTtsEngine(e.target.value)}
                className="bg-cozy-bg-alt text-cozy-text-dim text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-cozy-border shadow-sm outline-none focus:border-cozy-accent transition-all cursor-pointer hover:bg-cozy-panel"
                title="TTS Engine"
              >
                <option value="openai">OpenAI (Marin)</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="edge">Microsoft Edge</option>
              </select>

              {ttsEngine === 'elevenlabs' && (
                <select 
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="bg-cozy-bg-alt text-cozy-text-dim text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-cozy-border shadow-sm outline-none focus:border-cozy-accent transition-all cursor-pointer hover:bg-cozy-panel"
                  title="ElevenLabs Voice"
                >
                  {ELEVENLABS_VOICES.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.id === 'MClEFoImJXBTgLwdLI5n' ? 'Ivy (Ruby)' : voice.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button 
              onClick={stopAudio}
              title="Stop Audio"
              className="p-2 sm:p-3 text-red-500 hover:scale-110 transition-all bg-cozy-bg-alt rounded-lg sm:rounded-xl border border-cozy-border shadow-sm active:translate-y-0.5"
            >
              <VolumeX size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={clearHistory}
              title="Clear History"
              className="p-2 sm:p-3 text-cozy-text-dim hover:text-red-500 transition-colors bg-cozy-bg-alt rounded-lg sm:rounded-xl border border-cozy-border shadow-sm active:translate-y-0.5"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={onClose}
              title="Close"
              className="p-2 sm:p-3 text-cozy-text-dim hover:text-cozy-accent transition-colors bg-cozy-bg-alt rounded-lg sm:rounded-xl border border-cozy-border shadow-sm active:translate-y-0.5"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div 
          onClick={() => {
            // Focus input when clicking anywhere in the chat
            inputRef.current?.focus();
          }}
          className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 bg-cozy-bg cursor-pointer"
        >
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cozy-panel rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 border-2 border-cozy-border shadow-inner">
                <MessageSquare size={28} className="sm:w-8 sm:h-8 opacity-40" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-2 text-cozy-text-dark">Ready for Chat</h3>
              <p className="text-[10px] sm:text-xs font-medium leading-relaxed italic text-cozy-text">"Hey Ruby, how's my day looking?"</p>
            </div>
          )}
          
          {history.map((msg, i) => {
            const isLastOfSender = i === history.length - 1 || history[i + 1].sender !== msg.sender;
            const isFirstOfSender = i === 0 || history[i - 1].sender !== msg.sender;
            
            return (
              <div 
                key={msg.timestamp + i} 
                className={`flex gap-2 sm:gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} ${isFirstOfSender ? 'mt-4 sm:mt-6' : 'mt-1'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                {/* Avatar */}
                <div className="w-7 sm:w-8 flex-shrink-0">
                  {isFirstOfSender ? (
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-sm mt-1 ${
                      msg.sender === 'user' ? 'bg-cozy-accent text-white' : 'bg-cozy-panel border-2 border-cozy-border text-cozy-accent'
                    }`}>
                      {msg.sender === 'user' 
                        ? 'A' 
                        : (ttsEngine === 'elevenlabs' 
                            ? (ELEVENLABS_VOICES.find(v => v.id === ttsVoice)?.name?.[0] || '💎') 
                            : '💎')}
                    </div>
                  ) : null}
                </div>

                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[80%]`}>
                  <div 
                    className={`
                    relative px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-[1.2rem] sm:rounded-[1.4rem] text-sm sm:text-[15px] font-medium leading-relaxed shadow-sm transition-transform
                    ${msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-cozy-accent to-red-400 text-white rounded-br-none' 
                      : 'bg-cozy-panel text-cozy-text-dark border-2 border-cozy-border rounded-bl-none'}
                  `}>
                    {msg.sender === 'agent' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplay(msg);
                        }}
                        title="Replay Audio"
                        className="absolute -right-10 top-0 p-2 text-cozy-text-dim hover:text-cozy-accent hover:scale-110 transition-all bg-cozy-panel border border-cozy-border rounded-lg shadow-sm active:translate-y-0.5"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                    <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-cozy-bg-alt prose-pre:border prose-pre:border-cozy-border text-sm sm:text-inherit ${msg.sender === 'user' ? 'prose-invert' : 'dark:prose-invert text-cozy-text-dark'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.sender === 'agent' ? stripSpeechTags(msg.text) : msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {isLastOfSender && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-cozy-text-dim/40 uppercase tracking-tighter mt-1.5 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {isSending && (
            <div className="flex flex-col items-start animate-in fade-in duration-300">
              <div className="bg-cozy-panel text-cozy-text-dark border-2 border-cozy-border px-5 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-[1.8rem] rounded-tl-none shadow-sm flex items-center gap-1.5">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cozy-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cozy-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cozy-accent rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-8 border-t-2 border-cozy-border bg-cozy-panel/40 z-20">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 sm:gap-3 bg-cozy-bg p-1.5 sm:p-2.5 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-lg focus-within:border-cozy-accent transition-all duration-300"
          >
            <div className="pl-3 sm:pl-4 flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={toggleAutoSend}
                title={autoSend ? "Auto-send ON" : "Auto-send OFF"}
                className={`p-2 rounded-xl transition-all duration-300 ${autoSend ? 'text-yellow-500 bg-yellow-500/10 scale-110' : 'text-cozy-text-dim hover:bg-cozy-bg-alt'}`}
              >
                {autoSend ? <Zap size={18} fill="currentColor" className="sm:w-5 sm:h-5" /> : <ZapOff size={18} className="sm:w-5 sm:h-5" />}
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={autoSend ? "Type or dictate here..." : "Type here..."}
              className="flex-1 bg-transparent border-none outline-none px-2 sm:px-4 text-cozy-text-dark font-semibold placeholder:text-cozy-text-dim/40 text-base sm:text-lg"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className={`w-10 h-10 sm:w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                message.trim() && !isSending
                  ? 'bg-cozy-accent text-white hover:scale-105 active:scale-95 shadow-lg' 
                  : 'bg-cozy-bg-alt text-cozy-text-dim'
              }`}
            >
              {isSending ? <Loader2 size={20} className="sm:w-7 sm:h-7 animate-spin" /> : <Send size={20} className="sm:w-7 sm:h-7" />}
            </button>
          </form>
          <p className="hidden sm:block text-center mt-4 text-[9px] font-bold text-cozy-text-dim/40 uppercase tracking-[0.2em]">Ctrl + Win to focus instantly</p>
        </div>
      </div>
    </div>,
    document.body
  );
};
