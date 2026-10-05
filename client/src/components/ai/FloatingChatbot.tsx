import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Calendar,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  bookCards?: {
    id: string;
    title: string;
    author: string;
    department: string;
    availableCopies: number;
    shelfLocation?: string;
    coverUrl?: string | null;
  }[];
}

const QUICK_ACTIONS = [
  { label: '📅 Check my due dates', prompt: 'Check my due dates and active loans' },
  { label: '🔄 Renew my books', prompt: 'Renew my currently issued books' },
  { label: '🔍 Find Operating Systems books', prompt: 'Find Operating Systems books in catalog' },
  { label: '📜 Library rules & timings', prompt: 'What are the library rules, borrowing limits, and timings?' },
  { label: '🪑 Book a study seat', prompt: 'How do I book a seat in the silent study zone?' },
];

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi there! I'm **LibraBot**, your intelligent campus library assistant. Ask me to search books, check due dates, renew loans, or provide subject roadmaps!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech to text integration
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Default to Indian English / Multilingual

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const formattedHistory = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      formattedHistory.push({ role: 'user', content: query });

      const response = await api.post('/ai/chatbot', {
        messages: formattedHistory,
        userId: user?.id,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.data.reply || 'I received your request.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bookCards: response.data.bookCards || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm having a brief connection hitch. Please check if your backend server is active.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarkdownText = (text: string) => {
    // Process markdown headers, bold, bullets, and blockquotes
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Header 3 / 4
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 dark:text-white mt-2 mb-1 text-sm">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="font-semibold text-slate-800 dark:text-slate-200 mt-1 mb-0.5 text-xs">
            {line.replace('#### ', '')}
          </h5>
        );
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="border-l-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 pl-2.5 py-1 my-1 text-xs italic rounded-r text-slate-700 dark:text-slate-300">
            {line.replace('> ', '')}
          </div>
        );
      }
      // Bullet point
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.slice(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: renderBoldAndCode(content) }} />
          </li>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: renderBoldAndCode(line) }} />
        </p>
      );
    });
  };

  const renderBoldAndCode = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-600 dark:text-brand-400 font-mono text-[11px]">$1</code>');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
      {/* Expanded Chat Box */}
      {isOpen ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-[92vw] sm:w-[420px] max-h-[580px] h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight">LibraBot AI</h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-white/80">Smart Library Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/90 hover:text-white"
                title="Minimize chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(action.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5 border border-brand-200 dark:border-brand-800">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="space-y-1">
                    {m.sender === 'bot' ? formatMarkdownText(m.text) : <p className="leading-relaxed">{m.text}</p>}
                  </div>

                  {/* Render Book Cards if returned */}
                  {m.bookCards && m.bookCards.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Recommended Catalog Matches:
                      </p>
                      <div className="space-y-1.5">
                        {m.bookCards.map((b) => (
                          <div
                            key={b.id}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-brand-500 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {b.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                By {b.author} • {b.department}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px]">
                                <span className={`font-semibold ${b.availableCopies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {b.availableCopies > 0 ? `✅ ${b.availableCopies} Copies Avail.` : '⏳ Waitlist'}
                                </span>
                                {b.shelfLocation && (
                                  <span className="text-slate-400 dark:text-slate-500">• {b.shelfLocation}</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/book/${b.id}`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                            >
                              View <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 text-right ${
                      m.sender === 'user' ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-xs px-3.5 py-3 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Field */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Voice Input (Speech-to-text)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening to your voice...' : 'Ask LibraBot anything...'}
                className="flex-1 bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-xs px-3 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-all border border-transparent dark:border-slate-700/60"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Floating Trigger Button */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 text-white shadow-xl hover:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20"
          aria-label="Open Library AI Chatbot"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          {/* Notification pulse tag */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </span>
        </button>
      )}
    </div>
  );
};

export default FloatingChatbot;
