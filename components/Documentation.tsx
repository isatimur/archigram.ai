import React, { useState } from 'react';
import { Book, Code2, Keyboard, Zap, LayoutTemplate, ArrowLeft, Search, FileText, Share2, Copy, Check, GitBranch, Database, Clock, Network, BrainCircuit } from 'lucide-react';
import { AppView } from '../types.ts';

interface DocumentationProps {
  onNavigate: (view: AppView) => void;
}

const Documentation: React.FC<DocumentationProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-text flex flex-col font-sans overflow-hidden">
      
      {/* Doc Navbar */}
      <nav className="h-16 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
         <div className="flex items-center gap-4">
             <button 
                onClick={() => onNavigate('landing')}
                className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
                title="Back to Home"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-6 w-px bg-border"></div>
             <div className="flex items-center gap-2">
                 <Book className="w-5 h-5 text-primary" />
                 <span className="font-bold text-lg tracking-tight">Documentation</span>
             </div>
         </div>
         
         <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                    type="text" 
                    placeholder="Search docs..." 
                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
         </div>

         <button 
            onClick={() => onNavigate('app')}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all"
         >
            Open App
         </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-surface/30 hidden md:flex flex-col overflow-y-auto shrink-0">
            <div className="p-4 space-y-8">
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Essentials</h3>
                    <div className="space-y-1">
                        <SidebarLink active={activeSection === 'getting-started'} onClick={() => scrollTo('getting-started')} icon={<Zap className="w-4 h-4"/>}>Getting Started</SidebarLink>
                        <SidebarLink active={activeSection === 'ai-prompting'} onClick={() => scrollTo('ai-prompting')} icon={<Code2 className="w-4 h-4"/>}>AI Prompting</SidebarLink>
                        <SidebarLink active={activeSection === 'shortcuts'} onClick={() => scrollTo('shortcuts')} icon={<Keyboard className="w-4 h-4"/>}>Shortcuts</SidebarLink>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Diagram Syntax</h3>
                    <div className="space-y-1">
                        <SidebarLink active={activeSection === 'sequence'} onClick={() => scrollTo('sequence')} icon={<LayoutTemplate className="w-4 h-4"/>}>Sequence</SidebarLink>
                        <SidebarLink active={activeSection === 'flowchart'} onClick={() => scrollTo('flowchart')} icon={<Network className="w-4 h-4"/>}>Flowchart</SidebarLink>
                        <SidebarLink active={activeSection === 'class'} onClick={() => scrollTo('class')} icon={<LayoutTemplate className="w-4 h-4"/>}>Class</SidebarLink>
                        <SidebarLink active={activeSection === 'state'} onClick={() => scrollTo('state')} icon={<LayoutTemplate className="w-4 h-4"/>}>State</SidebarLink>
                        <SidebarLink active={activeSection === 'er'} onClick={() => scrollTo('er')} icon={<Database className="w-4 h-4"/>}>ER Diagram</SidebarLink>
                        <SidebarLink active={activeSection === 'gantt'} onClick={() => scrollTo('gantt')} icon={<Clock className="w-4 h-4"/>}>Gantt</SidebarLink>
                        <SidebarLink active={activeSection === 'mindmap'} onClick={() => scrollTo('mindmap')} icon={<BrainCircuit className="w-4 h-4"/>}>Mindmap</SidebarLink>
                        <SidebarLink active={activeSection === 'git'} onClick={() => scrollTo('git')} icon={<GitBranch className="w-4 h-4"/>}>Git Graph</SidebarLink>
                    </div>
                </div>

                 <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Guides</h3>
                    <div className="space-y-1">
                        <SidebarLink active={activeSection === 'exporting'} onClick={() => scrollTo('exporting')} icon={<Share2 className="w-4 h-4"/>}>Export & Share</SidebarLink>
                        <SidebarLink active={activeSection === 'themes'} onClick={() => scrollTo('themes')} icon={<FileText className="w-4 h-4"/>}>Custom Themes</SidebarLink>
                    </div>
                </div>
            </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border p-8 md:p-12 max-w-4xl mx-auto">
            
            <section id="getting-started" className="mb-16 scroll-mt-20">
                <h1 className="text-4xl font-bold mb-6 text-white">Getting Started</h1>
                <p className="text-lg text-text-muted mb-6 leading-relaxed">
                    Archigram.ai combines the structured power of Mermaid.js with the generative intelligence of Gemini 3 Flash. 
                    Unlike traditional drag-and-drop tools, Archigram uses a "Code-First, AI-Assisted" approach.
                </p>
                <div className="bg-surface border border-border rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Quick Start
                    </h3>
                    <ol className="list-decimal list-inside space-y-3 text-text-muted">
                        <li>Click <strong>New Diagram</strong> in the sidebar.</li>
                        <li>Type your request in the AI Copilot (e.g., "Create a login flow").</li>
                        <li>Watch the diagram generate instantly.</li>
                        <li>Refine the code manually in the editor or continue chatting with the AI.</li>
                    </ol>
                </div>
            </section>

            <section id="ai-prompting" className="mb-16 scroll-mt-20">
                <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                    <Code2 className="w-8 h-8 text-primary" />
                    AI Prompting Guide
                </h2>
                <p className="text-text-muted mb-6">
                    To get the best results from Gemini 3 Flash, be specific about the technical components and the flow logic.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-xl">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 block">Poor Prompt</span>
                        <p className="text-sm">"Make a diagram for an app."</p>
                    </div>
                    <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 block">Great Prompt</span>
                        <p className="text-sm">"Create a sequence diagram for a ride-sharing app where a User requests a ride, the System matches a Driver, and the Driver accepts the ride. Include database transactions."</p>
                    </div>
                </div>
            </section>

            <section id="shortcuts" className="mb-16 scroll-mt-20">
                 <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                    <Keyboard className="w-8 h-8 text-primary" />
                    Keyboard Shortcuts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShortcutKey combo={['Cmd', 'Z']} desc="Undo changes" />
                    <ShortcutKey combo={['Cmd', 'Y']} desc="Redo changes" />
                    <ShortcutKey combo={['Cmd', 'Enter']} desc="Submit AI Prompt" />
                    <ShortcutKey combo={['Esc']} desc="Close AI Chat / Modals" />
                </div>
            </section>

             <hr className="border-border my-12" />

             {/* DIAGRAM TYPES */}
             
             <section id="sequence" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Sequence Diagrams</h2>
                <p className="text-text-muted mb-6">
                    Used to show interactions between objects or systems in sequential order. Essential for API design and communication flows.
                </p>
                <CodeBlock code={`sequenceDiagram
    autonumber
    actor User
    participant API as Backend API
    participant DB as Database

    User->>API: Request Data
    activate API
    API->>DB: Query
    DB-->>API: Result
    API-->>User: Response Payload
    deactivate API`} />
            </section>

            <section id="flowchart" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Flowcharts</h2>
                <p className="text-text-muted mb-6">
                    Versatile diagrams for mapping process flows, decision trees, and system logic. Supports Top-Down (TD) and Left-Right (LR) layouts.
                </p>
                <CodeBlock code={`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`} />
            </section>

            <section id="class" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Class Diagrams</h2>
                <p className="text-text-muted mb-6">
                    Standard UML class diagrams for object-oriented modeling. Define properties, methods, and relationships.
                </p>
                <CodeBlock code={`classDiagram
    class Animal {
        +String name
        +int age
        +eat()
    }
    class Duck {
        +swim()
        +quack()
    }
    class Fish {
        +swim()
    }
    Animal <|-- Duck
    Animal <|-- Fish`} />
            </section>

            <section id="state" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">State Diagrams</h2>
                <p className="text-text-muted mb-6">
                    Describe the states of a system and the transitions between them. Useful for lifecycle management (e.g., Order Status, Auth Flow).
                </p>
                <CodeBlock code={`stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Submit Event
    Processing --> Success : Valid
    Processing --> Error : Invalid
    Success --> [*]
    Error --> Idle : Retry`} />
            </section>

            <section id="er" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">ER Diagrams</h2>
                <p className="text-text-muted mb-6">
                    Entity-Relationship diagrams for database schema design. Define entities, attributes, and cardinality (one-to-one, one-to-many).
                </p>
                <CodeBlock code={`erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created_at
    }`} />
            </section>

            <section id="gantt" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Gantt Charts</h2>
                <p className="text-text-muted mb-6">
                    Project management timelines. Visualize schedules, dependencies, and milestones.
                </p>
                <CodeBlock code={`gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Wireframing      :a1, 2024-01-01, 7d
    Prototyping      :after a1, 5d
    section Dev
    Backend API      :2024-01-10, 10d
    Frontend         :2024-01-12, 10d`} />
            </section>

             <section id="mindmap" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Mindmaps</h2>
                <p className="text-text-muted mb-6">
                    Hierarchical layout for brainstorming and organizing ideas.
                </p>
                <CodeBlock code={`mindmap
  root((Archigram))
    Features
      AI Generation
      Live Preview
      Export SVG
    Tech Stack
      React
      Mermaid.js
      Gemini 3`} />
            </section>

            <section id="git" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-2 text-white">Git Graph</h2>
                <p className="text-text-muted mb-6">
                    Visualize git branching strategies, commits, and merges.
                </p>
                <CodeBlock code={`gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit`} />
            </section>

             <hr className="border-border my-12" />

            <section id="exporting" className="mb-16 scroll-mt-20">
                <h2 className="text-2xl font-bold mb-4 text-white">Export & Sharing</h2>
                <div className="space-y-4 text-text-muted">
                    <p><strong>SVG Export:</strong> Best for high-quality printing and editing in vector tools like Illustrator.</p>
                    <p><strong>PNG Export:</strong> Best for slides, documents, and quick sharing. Renders at 3x resolution for crispness.</p>
                    <p><strong>Share Link:</strong> Generates a URL with the entire diagram code compressed. No server storage required.</p>
                </div>
            </section>

            <footer className="mt-20 pt-10 border-t border-border text-center text-text-muted text-sm pb-10">
                <p>Still have questions?</p>
                <a href="mailto:support@archigram.ai" className="text-primary hover:underline">Contact Support</a>
            </footer>

        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ children, active, onClick, icon }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
    >
        {icon}
        {children}
    </button>
);

const ShortcutKey = ({ combo, desc }: any) => (
    <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
        <span className="text-sm text-text-muted">{desc}</span>
        <div className="flex gap-1">
            {combo.map((k: string) => (
                <kbd key={k} className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-text font-bold shadow-sm">
                    {k}
                </kbd>
            ))}
        </div>
    </div>
);

const CodeBlock = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-border bg-[#0d0d10] group">
            <div className="flex justify-between items-center px-4 py-2 bg-surface border-b border-border/50">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-blue-100">
                {code}
            </pre>
        </div>
    );
};

export default Documentation;