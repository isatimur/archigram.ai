import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  Bot,
  History as HistoryIcon,
  MessageSquare,
  Clock,
  Copy,
  RefreshCw,
  Check,
  Zap,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  RotateCcw,
  Send,
  Archive,
  Share2,
} from 'lucide-react';
import { ChatMessage, CopilotDomain, ProjectVersion } from '../types.ts';
import { useUI } from '@/lib/contexts/UIContext';

type CopilotPanelProps = {
  projectId: string;
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  versions: ProjectVersion[];
  onRestoreVersion: (version: ProjectVersion) => void;
  onSaveVersion: (label: string) => void;
  onSharePrompt?: (promptText: string, resultCode?: string) => void;
  externalPrompt?: string;
  externalResultCode?: string;
  onConsumeExternalPrompt?: () => void;
};

const DOMAINS: CopilotDomain[] = ['General', 'Healthcare', 'Finance', 'E-commerce'];

const SUGGESTED_PROMPTS = [
  'Add a validation step',
  'Deploy to Kubernetes',
  'Add an encryption layer',
  'Connect to Data Lake',
];

const CopilotPanel: React.FC<CopilotPanelProps> = ({
  projectId,
  currentCode,
  onCodeUpdate,
  versions,
  onRestoreVersion,
  onSaveVersion,
  onSharePrompt,
  externalPrompt,
  externalResultCode,
  onConsumeExternalPrompt,
}) => {
  const { setIsCopilotOpen } = useUI();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CopilotDomain>('General');
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);

  // Project-Specific Message Handling
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat for specific project
  useEffect(() => {
    const key = `archigram_chat_${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [projectId]);

  // Save chat for specific project
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`archigram_chat_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, isLoading]);

  // Consume external prompt from "Try It" in Prompt Marketplace
  useEffect(() => {
    if (!externalPrompt) return;
    // If result code is provided, render it immediately
    if (externalResultCode) {
      onCodeUpdate(externalResultCode);
    }
    // Auto-submit the prompt text
    handleSubmit(externalPrompt);
    onConsumeExternalPrompt?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  const processAIRequest = async (userPrompt: string) => {
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, currentCode, domain: selectedDomain }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Generation failed');
      const { code: newCode } = await res.json();

      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `I have updated the pipeline for the ${selectedDomain} domain.`,
        codeSnapshot: newCode,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      onCodeUpdate(newCode);
    } catch {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: 'Failed to update diagram. Please try again.',
        isError: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');

    await processAIRequest(userMsg.text);
  };

  const handleRegenerate = async () => {
    if (isLoading) return;
    const reversedMessages = [...messages].reverse();
    const lastUserMessage = reversedMessages.find((m) => m.role === 'user');

    if (!lastUserMessage) return;

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'model') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await processAIRequest(lastUserMessage.text);
  };

  const handleFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m)));
    // In a real implementation, this would send an event to the backend analytics
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setJustCopied(id);
    setTimeout(() => setJustCopied(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirmingClear) {
      setMessages([]);
      localStorage.removeItem(`archigram_chat_${projectId}`);
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 3000);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !isLoading && lastMessage?.role === 'model';

  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col h-full shrink-0 font-sans">
      {/* Panel Header */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-border shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2 mr-auto">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-text">AI Copilot</span>
        </div>

        {/* Tabs inline in header */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            <HistoryIcon className="w-3 h-3" />
            History
            <span className="bg-surface-hover border border-border text-text-muted px-1 rounded-full text-[9px] font-mono">
              {versions.length}
            </span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsCopilotOpen(false)}
          className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-hover rounded-md ml-1"
          title="Close Copilot"
          aria-label="Close AI Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Domain Selector */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowDomainDropdown(!showDomainDropdown)}
            className="text-[10px] text-text-muted font-mono uppercase tracking-wider flex items-center gap-1 hover:text-text transition-colors"
          >
            <Bot className="w-3 h-3 text-primary" />
            Domain: {selectedDomain}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showDomainDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDomainDropdown(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 w-36 rounded-lg shadow-md bg-surface border border-border z-20 py-1">
                {DOMAINS.map((d) => (
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-background/40 relative">
        {/* --- TAB: CHAT --- */}
        {activeTab === 'chat' && (
          <div
            ref={scrollRef}
            className="p-4 space-y-6 min-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border"
          >
            {messages.length === 0 && (
              <div className="flex flex-col h-full min-h-[200px]">
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs gap-4 opacity-70">
                  <Bot className="w-10 h-10 text-primary opacity-50" />
                  <p>Describe your ML pipeline or system.</p>
                  <span className="px-2 py-1 bg-surface border border-border rounded text-[10px]">
                    Active Domain: {selectedDomain}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {SUGGESTED_PROMPTS.map((txt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(txt)}
                      className="px-3 py-2 text-left bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover rounded-md text-[10px] text-text-muted hover:text-text transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-primary flex-row-reverse' : 'text-text-muted'}`}
                >
                  <span>{msg.role === 'user' ? 'You' : 'ArchiGram.ai'}</span>
                </div>

                <div
                  className={`
                    p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full
                    ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm shadow-primary/20'
                        : msg.isError
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
                          : 'bg-surface border border-border text-text rounded-bl-sm'
                    }
                  `}
                >
                  {msg.text}

                  {msg.codeSnapshot && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border bg-background/50">
                      <div className="flex justify-between items-center px-2 py-1 bg-surface-hover/30 border-b border-border/50">
                        <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                          <Zap className="w-3 h-3 text-accent" />
                          Pipeline Updated
                        </span>
                        <button
                          onClick={() => handleCopyCode(msg.codeSnapshot ?? '', msg.id)}
                          className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-primary transition-colors"
                          title="Copy Code"
                        >
                          {justCopied === msg.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
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

                {/* Feedback & Share */}
                {msg.role === 'model' && !msg.isError && (
                  <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleFeedback(msg.id, 'helpful')}
                      className={`p-1 rounded hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${msg.feedback === 'helpful' ? 'text-green-500' : 'text-text-muted'}`}
                      title="Helpful"
                      aria-label="Mark as helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'unhelpful')}
                      className={`p-1 rounded hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${msg.feedback === 'unhelpful' ? 'text-red-500' : 'text-text-muted'}`}
                      title="Unhelpful"
                      aria-label="Mark as unhelpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    {msg.codeSnapshot && onSharePrompt && (
                      <button
                        onClick={() => {
                          const userMsg = messages
                            .slice(0, messages.indexOf(msg))
                            .reverse()
                            .find((m) => m.role === 'user');
                          if (userMsg) {
                            onSharePrompt(userMsg.text, msg.codeSnapshot);
                          }
                        }}
                        className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                        title="Share this prompt"
                        aria-label="Share this prompt"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {canRegenerate && (
              <div className="flex justify-start pl-2">
                <button
                  onClick={handleRegenerate}
                  title="Regenerate response"
                  className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
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
          <div className="flex flex-col h-full">
            {/* Manual Save Button */}
            <div className="p-3 border-b border-border bg-surface/50">
              <button
                onClick={() => {
                  if (snapshotSaving) return;
                  setSnapshotSaving(true);
                  onSaveVersion('Manual Snapshot');
                  setTimeout(() => setSnapshotSaving(false), 1500);
                }}
                disabled={snapshotSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {snapshotSaving ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-primary" />
                )}
                {snapshotSaving ? 'Saving...' : 'Create Snapshot'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border p-4 space-y-4">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-3 opacity-60">
                  <Clock className="w-8 h-8 opacity-20" />
                  <p>No saved versions yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-border ml-3 space-y-6">
                  {versions
                    .slice()
                    .reverse()
                    .map((version, index) => {
                      return (
                        <div key={version.id} className="relative pl-6 group">
                          <div
                            className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border transition-colors ${
                              version.source === 'manual'
                                ? 'bg-emerald-500 border-emerald-600'
                                : 'bg-border border-transparent group-hover:bg-primary group-hover:border-primary'
                            }`}
                          ></div>

                          <div className="bg-surface border border-border rounded-xl p-3 hover:bg-surface-hover transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-text flex items-center gap-2">
                                  {version.label}
                                  {version.source === 'manual' && (
                                    <span className="text-[8px] uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded">
                                      Saved
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] font-mono text-text-muted mt-0.5">
                                  {new Date(version.timestamp).toLocaleString(undefined, {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </span>
                              </div>
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                v{versions.length - index}
                              </span>
                            </div>

                            <div className="p-2 bg-background/50 rounded border border-border/50 mb-3 overflow-hidden">
                              <pre className="text-[9px] font-mono text-text-muted line-clamp-3 opacity-70">
                                {version.code}
                              </pre>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onRestoreVersion(version)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold bg-surface hover:bg-background border border-border rounded-lg transition-colors group/restore cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                              >
                                <RotateCcw className="w-3 h-3 group-hover/restore:rotate-[-45deg] transition-transform" />
                                Restore
                              </button>
                              <button
                                onClick={() => handleCopyCode(version.code, version.id)}
                                className="p-1.5 text-text-muted hover:text-text border border-border rounded-lg hover:bg-background cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                title="Copy Code"
                                aria-label={justCopied === version.id ? 'Code copied' : 'Copy code'}
                              >
                                {justCopied === version.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Only visible in Chat Tab) */}
      {activeTab === 'chat' && (
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
              aria-label="Ask ArchiGram AI"
              className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/50 p-2 max-h-32 min-h-[40px] resize-none focus:outline-none scrollbar-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-2 bg-primary hover:bg-primary-hover disabled:bg-surface-hover disabled:text-text-muted text-white rounded-lg transition-all shadow-lg shadow-primary/20 disabled:shadow-none mb-0.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex justify-between items-center px-1 mt-2">
            <span className="text-[9px] text-text-muted">
              Gemini 3 Flash • {selectedDomain} Context
            </span>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`text-[9px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50 rounded ${confirmingClear ? 'text-red-500 font-semibold' : 'text-text-muted hover:text-red-500'}`}
              >
                {confirmingClear ? 'Confirm Clear?' : 'Clear Chat'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
