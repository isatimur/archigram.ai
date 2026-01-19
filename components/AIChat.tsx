import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, X, Bot, History as HistoryIcon, MessageSquare, Clock, Copy, RefreshCw, Check, Zap, ThumbsUp, ThumbsDown, ChevronDown, RotateCcw, Send } from 'lucide-react';
import { generateDiagramCode } from '../services/geminiService.ts';
import { ChatMessage, DiagramTheme, CopilotDomain } from '../types.ts';

interface AIChatProps {
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  theme?: DiagramTheme;
}

const CHAT_STORAGE_KEY = 'aistudio_chat_history';

type Tab = 'chat' | 'history';

const SUGGESTED_PROMPTS = [
    "Add a validation step",
    "Deploy to Kubernetes",
    "Add an encryption layer",
    "Connect to Data Lake"
];

const DOMAINS: CopilotDomain[] = ['General', 'Healthcare', 'Finance', 'E-commerce'];

const AIChat: React.FC<AIChatProps> = ({ currentCode, onCodeUpdate, theme = 'dark' }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<CopilotDomain>('General');
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  
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
      const newCode = await generateDiagramCode(userPrompt, currentCode, selectedDomain);
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `I have updated the pipeline for the ${selectedDomain} domain.`,
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

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const textToProcess = typeof e === 'string' ? e : prompt;
    
    if (!textToProcess.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToProcess.trim(),
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

  const handleFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: type } : m));
      // In a real implementation, this would send an event to the backend analytics
      console.log(`[Phase 1 Feedback Loop] User rated message ${msgId} as ${type}`);
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
            className="absolute bottom-6 left-6 z-30 group flex items-center justify-center p-0 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent text-white shadow-2xl shadow-primary/40 hover:scale-105 transition-all duration-300 ring-2 ring-white/10"
            title="Open ArchiGram Copilot"
        >
            <Sparkles className="w-6 h-6 animate-pulse-slow" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        </button>
    );
  }
  
  return (
    <div className="absolute bottom-6 left-6 z-30 w-[420px] flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300 ease-in-out font-sans">
      <div className="bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 ring-1 ring-black/5">
        
        {/* Header with Domain Selector (Phase 1 Wedge) */}
        <div className="border-b border-border/50 bg-gradient-to-r from-surface-hover/50 to-transparent flex flex-col shrink-0">
            <div className="flex justify-between items-center p-4 pb-2">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col relative">
                        <span className="text-text font-bold text-sm tracking-tight flex items-center gap-1">
                            AI Copilot
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary uppercase">Beta</span>
                        </span>
                        
                        {/* Domain Dropdown */}
                        <div className="relative mt-0.5">
                             <button 
                                onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                                className="text-[10px] text-text-muted font-mono uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                             >
                                Domain: {selectedDomain}
                                <ChevronDown className="w-3 h-3" />
                             </button>
                             
                             {showDomainDropdown && (
                                 <>
                                 <div className="fixed inset-0 z-10" onClick={() => setShowDomainDropdown(false)}></div>
                                 <div className="absolute top-full left-0 mt-1 w-32 bg-surface border border-border rounded-lg shadow-xl z-20 py-1">
                                     {DOMAINS.map(d => (
                                         <button
                                            key={d}
                                            onClick={() => {
                                                setSelectedDomain(d);
                                                setShowDomainDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover ${selectedDomain === d ? 'text-primary font-bold' : 'text-text-muted'}`}
                                         >
                                            {d}
                                         </button>
                                     ))}
                                 </div>
                                 </>
                             )}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="text-text-muted hover:text-text transition-colors p-1.5 hover:bg-surface-hover rounded-lg"
                    title="Minimize"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex px-4 mt-2 gap-4">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
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
                    className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'history' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                >
                    <HistoryIcon className="w-3.5 h-3.5" />
                    Runs
                    <span className="bg-surface-hover border border-border text-text-muted px-1.5 rounded-full text-[9px] font-mono">{historyItems.length}</span>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background/40 relative">
            
            {/* --- TAB: CHAT --- */}
            {activeTab === 'chat' && (
                <div ref={scrollRef} className="p-4 space-y-6 min-h-[300px] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                     {messages.length === 0 && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs gap-4 opacity-70">
                                <Bot className="w-10 h-10 text-primary opacity-50" />
                                <p>Describe your ML pipeline or system.</p>
                                <span className="px-2 py-1 bg-surface border border-border rounded text-[10px]">Active Domain: {selectedDomain}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                {SUGGESTED_PROMPTS.map((txt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSubmit(txt)}
                                        className="p-3 text-left bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover rounded-xl text-[10px] text-text-muted hover:text-text transition-all duration-200"
                                    >
                                        {txt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1.5 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-primary flex-row-reverse' : 'text-text-muted'}`}>
                                <span>{msg.role === 'user' ? 'You' : 'ArchiGram.ai'}</span>
                            </div>

                            <div className={`
                                p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full backdrop-blur-sm
                                ${msg.role === 'user' 
                                    ? 'bg-primary text-white rounded-br-sm shadow-primary/20' 
                                    : msg.isError 
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
                                        : 'bg-surface border border-border text-text rounded-bl-sm'
                                }
                            `}>
                                {msg.text}
                                
                                {msg.codeSnapshot && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-border bg-background/50">
                                        <div className="flex justify-between items-center px-2 py-1 bg-surface-hover/30 border-b border-border/50">
                                            <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-accent" />
                                                Pipeline Updated
                                            </span>
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

                            {/* Phase 1: Feedback Loop */}
                            {msg.role === 'model' && !msg.isError && (
                                <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleFeedback(msg.id, 'helpful')}
                                        className={`p-1 rounded hover:bg-surface-hover ${msg.feedback === 'helpful' ? 'text-green-500' : 'text-text-muted'}`}
                                        title="Helpful"
                                    >
                                        <ThumbsUp className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => handleFeedback(msg.id, 'unhelpful')}
                                        className={`p-1 rounded hover:bg-surface-hover ${msg.feedback === 'unhelpful' ? 'text-red-500' : 'text-text-muted'}`}
                                        title="Unhelpful"
                                    >
                                        <ThumbsDown className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
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
                                <span>Generating</span>
                            </div>
                            <div className="bg-surface border border-border p-4 rounded-2xl rounded-bl-sm text-text-muted text-sm flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>Designing Pipeline...</span>
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
                            <p>No pipeline history yet.</p>
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
                                        
                                        <div className="bg-surface border border-border rounded-xl p-3 hover:bg-surface-hover transition-all shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-text-muted">
                                                    {new Date(item.timestamp).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">v{historyItems.length - index}</span>
                                            </div>
                                            <p className="text-xs text-text mb-3 line-clamp-2">{promptText}</p>
                                            
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => onCodeUpdate(item.codeSnapshot!)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold bg-surface hover:bg-background border border-border rounded-lg transition-colors"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Restore
                                                </button>
                                                <button 
                                                    onClick={() => handleCopyCode(item.codeSnapshot!, item.id)}
                                                    className="p-1.5 text-text-muted hover:text-text border border-border rounded-lg hover:bg-background"
                                                >
                                                    {justCopied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-surface border-t border-border">
            <form 
                onSubmit={handleSubmit}
                className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-inner"
            >
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder={`Ask ArchiGram.ai (${selectedDomain})...`}
                    className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/50 p-2 max-h-32 min-h-[40px] resize-none focus:outline-none scrollbar-none"
                    disabled={isLoading}
                />
                <button 
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="p-2 bg-primary hover:bg-primary-hover disabled:bg-surface-hover disabled:text-text-muted text-white rounded-lg transition-all shadow-lg shadow-primary/20 disabled:shadow-none mb-0.5"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
            <div className="flex justify-between items-center px-1 mt-2">
                <span className="text-[9px] text-text-muted">Gemini 3 Flash • {selectedDomain} Context</span>
                {messages.length > 0 && (
                    <button onClick={handleClearHistory} className="text-[9px] text-text-muted hover:text-red-500 transition-colors">
                        Clear History
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;