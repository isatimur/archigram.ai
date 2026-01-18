import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, RotateCcw, X, Bot, User, History as HistoryIcon, MessageSquare, Clock, ArrowRight, Copy, RefreshCw, Check } from 'lucide-react';
import { generateDiagramCode } from '../services/geminiService.ts';
import { ChatMessage, DiagramTheme } from '../types.ts';

interface AIChatProps {
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  theme?: DiagramTheme;
}

const CHAT_STORAGE_KEY = 'archigraph_chat_history';

type Tab = 'chat' | 'history';

const AIChat: React.FC<AIChatProps> = ({ currentCode, onCodeUpdate, theme = 'dark' }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [justCopied, setJustCopied] = useState<string | null>(null);
  
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

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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
        text: 'I have updated the diagram based on your request.',
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
    const reversedMessages = [...messages].reverse();
    const lastUserMessage = reversedMessages.find(m => m.role === 'user');

    if (!lastUserMessage) return;

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

  const handleCopyCode = (code: string, id: string) => {
      navigator.clipboard.writeText(code);
      setJustCopied(id);
      setTimeout(() => setJustCopied(null), 2000);
  };

  const handleClearHistory = () => {
    if(confirm('Clear all chat history and saved versions?')) {
        setMessages([]);
        localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }

  const historyItems = messages.filter(m => m.role === 'model' && m.codeSnapshot);
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !isLoading && lastMessage?.role === 'model';

  if (!isExpanded) {
    return (
        <button 
            onClick={() => setIsExpanded(true)}
            className="absolute bottom-6 left-6 z-30 p-4 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            title="Open AI Architect"
        >
            <Sparkles className="w-6 h-6" />
        </button>
    );
  }

  // Define dynamic style classes based on theme for the chat window
  // Using tailwind generic classes like bg-surface/95 ensures it adapts to the global variables
  
  return (
    <div className="absolute bottom-6 left-6 z-30 w-96 flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300 ease-in-out font-sans">
      <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 ring-1 ring-border/20">
        
        {/* Header with Tabs */}
        <div className="border-b border-border bg-surface-hover/50 flex flex-col shrink-0">
            <div className="flex justify-between items-center p-3 pb-0">
                 <div className="flex items-center gap-2 text-text font-bold text-sm tracking-tight px-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>AI Architect</span>
                </div>
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-hover rounded-md"
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
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 pb-2 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'history' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                >
                    <HistoryIcon className="w-3.5 h-3.5" />
                    History
                    <span className="bg-surface-hover text-text-muted px-1.5 rounded-full text-[9px]">{historyItems.length}</span>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background/30 relative">
            
            {/* --- TAB: CHAT --- */}
            {activeTab === 'chat' && (
                <div ref={scrollRef} className="p-4 space-y-4 min-h-[200px] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                     {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs py-8 gap-3 opacity-60">
                            <Bot className="w-8 h-8 opacity-20" />
                            <p>Ask me to create or modify a diagram.</p>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-primary flex-row-reverse' : 'text-text-muted'}`}>
                                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                <span>{msg.role === 'user' ? 'You' : 'Architect'}</span>
                            </div>

                            <div className={`
                                p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full
                                ${msg.role === 'user' 
                                    ? 'bg-surface-hover text-text rounded-tr-sm border border-border' 
                                    : msg.isError 
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-tl-sm'
                                        : 'bg-primary/10 text-text border border-primary/20 rounded-tl-sm'
                                }
                            `}>
                                {msg.text}
                                
                                {/* Code Snapshot Block inside Chat Bubble */}
                                {msg.codeSnapshot && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-border bg-background/50">
                                        <div className="flex justify-between items-center px-2 py-1 bg-surface-hover/30 border-b border-border/50">
                                            <span className="text-[10px] font-mono text-text-muted">Mermaid Preview</span>
                                            <button 
                                                onClick={() => handleCopyCode(msg.codeSnapshot!, msg.id)}
                                                className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-primary transition-colors"
                                                title="Copy Code"
                                            >
                                                {justCopied === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="p-2 overflow-x-auto">
                                            <pre className="text-[10px] font-mono text-text-muted whitespace-pre">
                                                {msg.codeSnapshot.slice(0, 150)}...
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {canRegenerate && (
                        <div className="flex justify-start pl-2">
                             <button 
                                onClick={handleRegenerate}
                                title="Regenerate response"
                                className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-hover"
                             >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                             </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col gap-2 max-w-[85%] mr-auto items-start animate-pulse">
                             <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-primary">
                                <Bot className="w-3 h-3" />
                                <span>AI Processing</span>
                            </div>
                            <div className="bg-surface border border-border p-3 rounded-2xl rounded-tl-sm text-text-muted text-sm flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>Generating Diagram...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === 'history' && (
                <div className="p-4 space-y-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                     {historyItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-3 opacity-60">
                            <Clock className="w-8 h-8 opacity-20" />
                            <p>No version history available yet.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-border ml-3 space-y-6">
                            {historyItems.map((item, index) => {
                                const itemIndex = messages.findIndex(m => m.id === item.id);
                                const promptMsg = itemIndex > 0 ? messages[itemIndex - 1] : null;
                                const promptText = promptMsg?.role === 'user' ? promptMsg.text : 'Manual Generation';

                                return (
                                    <div key={item.id} className="relative pl-6 group">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border border-border group-hover:border-primary group-hover:bg-primary transition-colors"></div>
                                        
                                        <div className="bg-surface border border-border rounded-xl p-3 hover:bg-surface-hover transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-text-muted">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </span>
                                                <span className="text-[9px] bg-surface-hover text-text-muted px-1.5 rounded uppercase tracking-wider">
                                                    v{messages.filter(m => m.codeSnapshot && m.timestamp <= item.timestamp).length}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-text font-medium line-clamp-2 mb-3 italic">
                                                "{promptText}"
                                            </p>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[10px] text-text-muted font-mono">
                                                    {item.codeSnapshot?.length} chars
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleCopyCode(item.codeSnapshot!, item.id)}
                                                        className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                                                        title="Copy Code"
                                                    >
                                                        {justCopied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestore(item.codeSnapshot!)}
                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary px-2.5 py-1.5 rounded-lg transition-all"
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
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Input Area */}
        {activeTab === 'chat' && (
             <div className="p-3 border-t border-border bg-surface-hover/50 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe changes..."
                        className="w-full bg-background border border-border rounded-xl p-3 pr-10 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none h-14 scrollbar-none"
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
                        className="absolute bottom-3 right-3 p-1.5 bg-primary rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                </form>
                <div className="flex justify-between items-center mt-2 px-1">
                     <p className="text-[9px] text-text-muted font-mono">
                        Powered by Gemini 3 Flash
                    </p>
                    {messages.length > 0 && (
                        <button 
                            onClick={handleClearHistory}
                            className="text-[9px] text-text-muted hover:text-red-500 transition-colors"
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