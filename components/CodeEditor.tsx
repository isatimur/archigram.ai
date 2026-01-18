import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Undo, Redo, AlertCircle, AlertTriangle, CheckCircle2, XCircle, Terminal } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  error?: string | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  error
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(true);

  // Parse error line number
  const errorLine = useMemo(() => {
    if (!error) return null;
    const match = error.match(/line\s+(\d+)/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return null;
  }, [error]);

  // Sync scroll
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Auto-expand diagnostics on error
  useEffect(() => {
    if (error) {
        setIsDiagnosticsOpen(true);
    }
  }, [error]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement !== textareaRef.current) return;

        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            e.shiftKey ? onRedo() : onUndo();
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            onRedo();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);


  // Robust Tokenizer for Mermaid Syntax
  const highlightCode = (text: string) => {
    if (!text) return '';

    const patterns = [
      { regex: /(%%.*)/, className: 'text-zinc-500 italic' }, // Comments
      { regex: /("[^"]*")/, className: 'text-emerald-400' }, // Strings
      { regex: /\b(sequenceDiagram|classDiagram|graph|flowchart|gantt|erDiagram|pie|stateDiagram|stateDiagram-v2|gitGraph|journey|mindmap|timeline)\b/, className: 'text-violet-400 font-bold' }, // Types
      { regex: /\b(participant|actor|class|subgraph|end|note|alt|opt|loop|else|rect|par|and|break|critical|autonumber|activate|deactivate|title|style|linkStyle|classDef)\b/, className: 'text-blue-400 font-semibold' }, // Keywords
      { regex: /(\-\-\>\>|\-\-\>|\-\-\-|\-\>|\-\>\>|\=\=\>|\=\=|\-\.->|\-\.\-)/, className: 'text-cyan-400 font-bold' }, // Arrows
      { regex: /\b(left of|right of|over|TB|TD|BT|RL|LR)\b/, className: 'text-orange-400' }, // Directions
      { regex: /([\[\]\(\)\{\}])/, className: 'text-yellow-400' }, // Brackets & Shapes
    ];

    const combinedSource = patterns.map(p => p.regex.source).join('|');
    const combinedRegex = new RegExp(combinedSource, 'g');

    let lastIndex = 0;
    let html = '';
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        html += text.slice(lastIndex, match.index)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      let matchedGroupIndex = -1;
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          matchedGroupIndex = i - 1;
          break;
        }
      }

      const content = match[0]
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (matchedGroupIndex !== -1 && patterns[matchedGroupIndex]) {
        html += `<span class="${patterns[matchedGroupIndex].className}">${content}</span>`;
      } else {
        html += content;
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      html += text.slice(lastIndex)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return html;
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0f]">
      {/* Editor Toolbar */}
      <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0 h-10 box-border">
        <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                diagram.mmd
            </span>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-1">
                <button onClick={onUndo} disabled={!canUndo} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-zinc-800" title="Undo">
                    <Undo className="w-3.5 h-3.5" />
                </button>
                <button onClick={onRedo} disabled={!canRedo} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-zinc-800" title="Redo">
                    <Redo className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
        <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            Mermaid Syntax
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
         {/* Line Numbers Gutter */}
         <div 
            ref={gutterRef}
            className="w-12 pt-4 pb-4 bg-zinc-950 border-r border-zinc-800 text-right select-none overflow-hidden shrink-0 z-10"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
         >
            {Array.from({ length: lineCount }).map((_, i) => {
                const lineNum = i + 1;
                const isError = errorLine === lineNum;
                return (
                    <div 
                        key={i} 
                        className={`text-sm leading-6 pr-3 font-mono transition-colors duration-200 relative
                            ${isError ? 'text-red-400 font-bold bg-red-900/20' : 'text-zinc-600'}
                        `}
                    >
                        {isError && (
                             <div className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        )}
                        {lineNum}
                    </div>
                );
            })}
         </div>

        {/* Code Area Container */}
        <div className="flex-1 relative overflow-hidden group bg-[#09090b]">
            
            {/* Error Line Highlight Overlay */}
            {errorLine !== null && (
                <div 
                    className="absolute left-0 right-0 bg-red-500/10 border-t border-b border-red-500/20 pointer-events-none z-0"
                    style={{ 
                        top: `calc(1rem + ${(errorLine - 1) * 1.5}rem - ${textareaRef.current?.scrollTop || 0}px)`, 
                        height: '1.5rem',
                        transition: 'top 0.1s'
                    }}
                />
            )}

            {/* Syntax Highlight Layer */}
            <pre
            ref={preRef}
            className="absolute inset-0 p-4 m-0 font-mono text-sm leading-6 pointer-events-none whitespace-pre overflow-hidden"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
            dangerouslySetInnerHTML={{ __html: highlightCode(code) + '<br/>' }} 
            />
            
            {/* Input Layer */}
            <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent text-sm font-mono leading-6 caret-white resize-none outline-none whitespace-pre overflow-auto z-10"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            style={{ 
                fontFamily: '"JetBrains Mono", monospace',
                caretColor: 'white'
            }}
            />
        </div>
      </div>

      {/* Diagnostics / Problems Panel */}
      <div className={`border-t border-zinc-800 bg-[#09090b] transition-all duration-300 ease-in-out flex flex-col ${isDiagnosticsOpen ? 'h-32' : 'h-8'}`}>
        {/* Panel Header */}
        <div 
            className="flex items-center justify-between px-4 h-8 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors select-none border-b border-zinc-800"
            onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
        >
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Problems
                </span>
                {error ? (
                    <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full">
                        1 Error
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600 px-1.5 py-0.5">
                        0 Errors
                    </span>
                )}
            </div>
            <div className="text-zinc-600">
                {isDiagnosticsOpen ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                )}
            </div>
        </div>

        {/* Panel Content */}
        {isDiagnosticsOpen && (
            <div className="flex-1 overflow-y-auto p-0 font-mono text-xs">
                {error ? (
                    <div 
                        className="flex items-start gap-3 p-3 hover:bg-red-500/5 transition-colors cursor-pointer group border-l-2 border-red-500"
                        onClick={() => {
                             if(textareaRef.current && errorLine) {
                                const lineHeight = 24; 
                                textareaRef.current.scrollTop = (errorLine - 5) * lineHeight;
                            }
                        }}
                    >
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-zinc-300 group-hover:text-white transition-colors">
                                {error}
                            </p>
                            <p className="text-zinc-500 mt-1">
                                {errorLine ? `Source: mermaid-parser (Line ${errorLine})` : 'Source: mermaid-parser'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2 opacity-50">
                        <CheckCircle2 className="w-6 h-6" />
                        <p>No problems detected. Diagram is valid.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;