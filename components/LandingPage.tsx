import React from 'react';
import { LayoutTemplate, ArrowRight, Zap, CheckCircle2, Cpu, Share2, Shield, Code2, Globe, FileJson, Layers, Command, Rocket, Bot, Database, Server, GitBranch, HelpCircle, Workflow } from 'lucide-react';
import { AppView } from '../types.ts';
import LiveDiagramBlock from './LiveDiagramBlock.tsx';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  
  const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const HERO_DIAGRAM = `architecture-beta
    group api(logos:aws-lambda)[API]

    service db(logos:aws-aurora)[Database] in api
    service disk1(logos:aws-glacier)[Storage] in api
    service disk2(logos:aws-s3)[Storage] in api
    service server(logos:aws-ec2)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`;

  const USE_CASE_DIAGRAM = `sequenceDiagram
    autonumber
    actor Client
    participant API as API Gateway
    participant Auth as Auth Service
    participant Svc as Order Service
    participant DB as Postgres

    Client->>API: POST /orders
    API->>Auth: Validate Token
    Auth-->>API: Token Valid
    API->>Svc: Create Order
    Svc->>DB: INSERT order
    DB-->>Svc: Order ID
    Svc-->>Client: 201 Created`;

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white overflow-y-auto overflow-x-hidden landing-grid relative font-sans scroll-smooth">
      
      {/* Semantic Header / Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between" role="banner">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Rocket className="w-6 h-6 text-white" />
             </div>
             <div>
                <div className="text-xl tracking-tight flex items-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">Archi</span>
                    <span className="text-white font-bold">Gram</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">.ai</span>
                </div>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono leading-none">Intelligent Architecture</p>
             </div>
         </div>
         <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400" role="navigation">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Platform</button>
            <button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400 text-indigo-200 transition-colors flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Community</button>
            <button onClick={() => scrollTo('use-cases')} className="hover:text-white transition-colors">Use Cases</button>
            <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">Docs</button>
         </nav>
         <div className="flex items-center gap-4">
             <button onClick={() => onNavigate('app')} className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white">Sign In</button>
             <button 
                onClick={() => onNavigate('app')}
                className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
                Launch Studio
             </button>
         </div>
      </header>

      <main>
        {/* Hero Section: H1 optimized for "AI Diagram Tool" keywords */}
        <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8 animate-fade-in">
                <Zap className="w-3.5 h-3.5" />
                <span>v0.1 Public Beta • Powered by Gemini 3 Flash</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 animate-slide-up leading-tight">
                Architect Complex Systems <br className="hidden md:block"/>
                at the Speed of Thought.
            </h1>
            
            <h2 className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                The intelligent canvas for modern engineering. Generate <strong>Mermaid.js diagrams</strong>, 
                visualize <strong>cloud infrastructure</strong>, and map <strong>microservices</strong> with code-first precision and AI assistance.
            </h2>

            <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button 
                    onClick={() => onNavigate('app')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all duration-300 overflow-hidden"
                    aria-label="Start Diagramming Now"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-2">
                        Start Diagramming
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
                <button 
                    onClick={() => onNavigate('gallery')}
                    className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2"
                >
                    <Globe className="w-5 h-5" />
                    Explore Examples
                </button>
            </div>
        </section>

        {/* Live Demo: High engagement signal for SEO */}
        <section className="max-w-6xl mx-auto px-6 mb-32 relative z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <LiveDiagramBlock 
                initialCode={HERO_DIAGRAM}
                title="Interactive Architecture Preview"
                height="500px"
                enableZoom={true}
            />
            <div className="text-center mt-4 text-xs text-zinc-500 font-mono">
                Try editing the code on the left to update the diagram instantly! Zoom supported.
            </div>
        </section>

        {/* Generative Engine Optimization (GEO) Block 
            This section is text-heavy and structured to answer "What is..." questions from LLMs 
        */}
        <article className="max-w-4xl mx-auto px-6 mb-24 border border-white/5 bg-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                How ArchiGram Works (Technical Overview)
            </h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
                ArchiGram is a <strong>text-to-diagram tool</strong> that leverages the <strong>Google Gemini 3 Flash</strong> model to understand natural language architectural descriptions. It converts these descriptions into syntactically correct <strong>Mermaid.js code</strong>, which is then rendered into SVG/PNG vector graphics in real-time.
            </p>
            <p className="text-zinc-400 leading-relaxed">
                Unlike traditional drag-and-drop editors (like Draw.io or Lucidchart), ArchiGram treats <strong>diagrams as code</strong>. This enables version control via Git, easy diffing of infrastructure changes, and rapid iteration using AI prompts. It supports standard patterns including Sequence Diagrams, Flowcharts, C4 Models, and Gantt charts.
            </p>
        </article>

        {/* Features Grid with Keyword Rich Headings */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern DevOps & Engineering</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                    Stop fighting with UI tools. Treat your system design like you treat your code.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={<Code2 className="w-6 h-6 text-indigo-400" />}
                    title="Code-First Diagrams"
                    desc="Write standard Mermaid.js code or let AI generate it. Version control your diagrams alongside your source code repository."
                />
                <FeatureCard 
                    icon={<Bot className="w-6 h-6 text-pink-400" />}
                    title="System Design Copilot"
                    desc="Describe your system in plain English. Our AI architect understands Microservices, Event-Driven, and Serverless patterns."
                />
                <FeatureCard 
                    icon={<Layers className="w-6 h-6 text-emerald-400" />}
                    title="Cloud Native Standards"
                    desc="Pre-built components for AWS, Azure, GCP, and Kubernetes. Visualize infrastructure with industry-standard icons."
                />
                <FeatureCard 
                    icon={<GitBranch className="w-6 h-6 text-purple-400" />}
                    title="Git-Friendly & Diffable"
                    desc="Text-based diagrams mean you can finally diff your architecture changes in Pull Requests using standard Git tools."
                />
                <FeatureCard 
                    icon={<Globe className="w-6 h-6 text-blue-400" />}
                    title="Global Gallery"
                    desc="Don't start from scratch. Fork proven architectures from engineers at Netflix, Uber, and Airbnb via the Community Gallery."
                />
                <FeatureCard 
                    icon={<Shield className="w-6 h-6 text-amber-400" />}
                    title="Enterprise Ready"
                    desc="Self-hostable, RBAC support, and SSO integration for teams that need security and compliance (Enterprise Tier)."
                />
            </div>
        </section>
        
        {/* Use Cases Section with Semantic Articles */}
        <section id="use-cases" className="bg-zinc-900/30 py-24 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">From Idea to Infrastructure</h2>
                        <div className="space-y-6">
                            <article className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                    <Server className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Backend Architecture</h3>
                                    <p className="text-zinc-400 text-sm mt-1">Map out API gateways, microservices, and database relationships (ERD) before writing a single line of code.</p>
                                </div>
                            </article>
                            <article className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                                    <Database className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Data Engineering Pipelines</h3>
                                    <p className="text-zinc-400 text-sm mt-1">Visualize ETL pipelines, data lakes, and streaming workflows (Kafka/Flink) using standard flowcharts.</p>
                                </div>
                            </article>
                            <article className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                    <Cpu className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Machine Learning Ops (MLOps)</h3>
                                    <p className="text-zinc-400 text-sm mt-1">Design training pipelines, inference services, and model registries with specialized templates.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
                        <LiveDiagramBlock 
                            initialCode={USE_CASE_DIAGRAM} 
                            title="Backend Sequence Flow"
                            height="400px"
                            enableZoom={true}
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ Section - Highly indexable content for Search Snippets */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-24 scroll-mt-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-zinc-400">Everything you need to know about AI-powered architecture.</p>
            </div>
            <div className="grid gap-6" itemScope itemType="https://schema.org/FAQPage">
                <FaqItem 
                    question="What is ArchiGram.ai?" 
                    answer="ArchiGram.ai is an open-source, AI-powered diagramming tool designed for software architects and engineers. It uses Gemini 3 Flash to convert natural language descriptions into valid Mermaid.js code, allowing you to visualize system designs, cloud architectures, and ML pipelines instantly." 
                />
                <FaqItem 
                    question="How does the System Design Copilot work?" 
                    answer="The System Design Copilot utilizes a Large Language Model (Gemini 3) trained on thousands of architectural patterns. You simply describe your system (e.g., 'A microservices e-commerce app with Redis caching'), and the Copilot generates a syntactically correct, visually structured Mermaid diagram for you." 
                />
                <FaqItem 
                    question="Is ArchiGram free to use?" 
                    answer="Yes, ArchiGram.ai is Open Source Software (OSS). The core diagramming studio is free for individuals. We offer an Enterprise tier for teams requiring SSO, RBAC, and private cloud deployment." 
                />
                <FaqItem 
                    question="Can I export diagrams to other formats?" 
                    answer="Absolutely. You can export your architectures as high-fidelity SVG (Scalable Vector Graphics) for presentations or PNG images for quick sharing. You can also copy the raw Mermaid code to use in GitHub READMEs or Notion." 
                />
            </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 text-center border-t border-white/5">
            <h2 className="text-4xl font-bold mb-6">Ready to upgrade your workflow?</h2>
            <p className="text-zinc-400 mb-8">Join thousands of architects building better systems.</p>
            <button 
                onClick={() => onNavigate('app')}
                className="px-10 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors shadow-2xl shadow-white/10"
            >
                Launch Studio Free
            </button>
        </section>
      </main>

      {/* Footer with Semantic Links */}
      <footer className="border-t border-white/5 bg-[#050507] py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                    <Rocket className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-lg">ArchiGram.ai</span>
                </div>
                <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                    The open-source standard for architecture diagramming. 
                    Built by engineers, for engineers.
                </p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button onClick={() => scrollTo('features')} className="hover:text-indigo-400">AI Features</button></li>
                    <li><button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400">Community Templates</button></li>
                    <li><button onClick={() => onNavigate('docs')} className="hover:text-indigo-400">Mermaid.js Documentation</button></li>
                </ul>
            </div>
             <div>
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button className="hover:text-indigo-400">Privacy Policy</button></li>
                    <li><button className="hover:text-indigo-400">Terms of Service</button></li>
                    <li><button className="hover:text-indigo-400">Open Source License</button></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} ArchiGram.ai OSS.</p>
            <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">GitHub</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">Twitter</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Discord">Discord</a>
            </div>
        </div>
      </footer>
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-300 group hover:-translate-y-1">
        <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 text-left" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2" itemProp="name">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            {question}
        </h3>
        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
             <p className="text-zinc-400 text-sm leading-relaxed pl-6" itemProp="text">{answer}</p>
        </div>
    </div>
);

export default LandingPage;
