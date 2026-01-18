import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, RotateCcw, X, Bot, User, History as HistoryIcon, MessageSquare, Clock, ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { generateDiagramCode } from '../services/geminiService.ts';
import { ChatMessage } from '../types.ts';

interface AIChatProps {
  currentCode: string;
  onCodeUpdate: (code: string) => void;
}

const CHAT_STORAGE_KEY = 'archigraph_chat_history';

type Tab = 'chat' | 'history';

const AIChat: React.FC<AIChatProps> = ({ currentCode, onCodeUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load chat history", e);
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll for chat
  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded, activeTab, isLoading]);

  const processAIRequest = async (userPrompt: string) => {
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const newCode = await generateDiagramCode(userPrompt, currentCode);
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: 'Diagram updated successfully.',
        codeSnapshot: newCode,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
      onCodeUpdate(newCode);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: 'Failed to update diagram. Please try again.',
        isError: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: prompt.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    
    await processAIRequest(userMsg.text);
  };

  const handleRegenerate = async () => {
    if (isLoading) return;

    // Find the last user message to regenerate from
    const reversedMessages = [...messages].reverse();
    const lastUserMessage = reversedMessages.find(m => m.role === 'user');

    if (!lastUserMessage) return;

    // Optional: Remove the last AI message if it exists (to replace it)
    setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'model') {
            return prev.slice(0, -1);
        }
        return prev;
    });

    await processAIRequest(lastUserMessage.text);
  };

  const handleRestore = (code: string) => {
    if (confirm('Revert diagram to this version? Current unsaved changes will be lost.')) {
        onCodeUpdate(code);
    }
  };

  const handleCopyCode = (code: string) => {
      navigator.clipboard.writeText(code);
  };

  const handleClearHistory = () => {
    if(confirm('Clear all chat history and saved versions?')) {
        setMessages([]);
        localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }

  // Filter messages that have code snapshots for the history tab
  const historyItems = messages.filter(m => m.role === 'model' && m.codeSnapshot);

  // Check if we should show regenerate button (last message is from AI)
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !isLoading && lastMessage?.role === 'model';

  if (!isExpanded) {
    return (
        <button 
            onClick={() => setIsExpanded(true)}
            className="absolute bottom-6 left-6 z-30 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
            title="Open AI Architect"
        >
            <Sparkles className="w-6 h-6" />
        </button>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 z-30 w-96 flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300 ease-in-out font-sans">
      <div className="bg-[#18181b]/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 ring-1 ring-white/10">
        
        {/* Header with Tabs */}
        <div className="border-b border-zinc-800 bg-zinc-900/50 flex flex-col shrink-0">
            <div className="flex justify-between items-center p-3 pb-0">
                 <div className="flex items-center gap-2 text-white font-bold text-sm tracking-tight px-1">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Architect</span>
                </div>
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md"
                    title="Minimize"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex px-2 mt-3 gap-1">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 pb-2 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'chat' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 pb-2 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'history' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <HistoryIcon className="w-3.5 h-3.5" />
                    History
                    <span className="bg-zinc-800 text-zinc-400 px-1.5 rounded-full text-[9px]">{historyItems.length}</span>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-900/20 relative">
            
            {/* --- TAB: CHAT --- */}
            {activeTab === 'chat' && (
                <div ref={scrollRef} className="p-4 space-y-4 min-h-[200px] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                     {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-8 gap-3 opacity-60">
                            <Bot className="w-8 h-8 opacity-20" />
                            <p>Ask me to create or modify a diagram.</p>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-indigo-400 flex-row-reverse' : 'text-zinc-500'}`}>
                                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                <span>{msg.role === 'user' ? 'You' : 'Architect'}</span>
                            </div>

                            <div className={`
                                p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                ${msg.role === 'user' 
                                    ? 'bg-zinc-800 text-zinc-200 rounded-tr-sm border border-zinc-700' 
                                    : msg.isError 
                                        ? 'bg-red-900/20 text-red-200 border border-red-900/30 rounded-tl-sm'
                                        : 'bg-indigo-900/20 text-indigo-100 border border-indigo-500/20 rounded-tl-sm'
                                }
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {/* Regenerate Button for last message */}
                    {canRegenerate && (
                        <div className="flex justify-start pl-2">
                             <button 
                                onClick={handleRegenerate}
                                title="Regenerate response"
                                className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-indigo-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-indigo-500/10"
                             >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                             </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col gap-2 max-w-[85%] mr-auto items-start animate-pulse">
                             <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                                <Bot className="w-3 h-3" />
                                <span>AI Processing</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-sm text-zinc-400 text-sm flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                <span>Generating Diagram...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === 'history' && (
                <div className="p-4 space-y-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                     {historyItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs gap-3 opacity-60">
                            <Clock className="w-8 h-8 opacity-20" />
                            <p>No version history available yet.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-zinc-800 ml-3 space-y-6">
                            {historyItems.map((item, index) => {
                                // Find the prompt that generated this (usually the preceding user message)
                                const itemIndex = messages.findIndex(m => m.id === item.id);
                                const promptMsg = itemIndex > 0 ? messages[itemIndex - 1] : null;
                                const promptText = promptMsg?.role === 'user' ? promptMsg.text : 'Manual Generation';

                                return (
                                    <div key={item.id} className="relative pl-6 group">
                                        {/* Dot */}
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-600 group-hover:border-indigo-500 group-hover:bg-indigo-500 transition-colors"></div>
                                        
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-900 hover:border-zinc-700 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </span>
                                                <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 rounded uppercase tracking-wider">
                                                    v{messages.filter(m => m.codeSnapshot && m.timestamp <= item.timestamp).length}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-zinc-300 font-medium line-clamp-2 mb-3 italic">
                                                "{promptText}"
                                            </p>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[10px] text-zinc-600 font-mono">
                                                    {item.codeSnapshot?.length} chars
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleCopyCode(item.codeSnapshot!)}
                                                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                                        title="Copy Code"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestore(item.codeSnapshot!)}
                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-2.5 py-1.5 rounded-lg transition-all"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Restore
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }).reverse()} 
                            {/* Reverse to show newest first */}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Input Area (Only visible on Chat Tab) */}
        {activeTab === 'chat' && (
             <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe changes..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pr-10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-14 scrollbar-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                </form>
                <div className="flex justify-between items-center mt-2 px-1">
                     <p className="text-[9px] text-zinc-600 font-mono">
                        Powered by Gemini 1.5
                    </p>
                    {messages.length > 0 && (
                        <button 
                            onClick={handleClearHistory}
                            className="text-[9px] text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            Clear History
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;