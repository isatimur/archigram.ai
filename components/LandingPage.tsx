import React from 'react';
import { LayoutTemplate, ArrowRight, Zap, CheckCircle2, Cpu, Share2, Shield, Code2, Globe, FileJson, Layers, Command, Rocket, Bot, Database, Server, GitBranch, HelpCircle } from 'lucide-react';
import { AppView } from '../types.ts';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  
  const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white overflow-y-auto overflow-x-hidden landing-grid relative font-sans scroll-smooth">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
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
         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Platform</button>
            <button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400 text-indigo-200 transition-colors flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Community</button>
            <button onClick={() => scrollTo('use-cases')} className="hover:text-white transition-colors">Use Cases</button>
            <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">Docs</button>
         </div>
         <div className="flex items-center gap-4">
             <button onClick={() => onNavigate('app')} className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white">Sign In</button>
             <button 
                onClick={() => onNavigate('app')}
                className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
                Launch Studio
             </button>
         </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            <span>v0.1 Public Beta • Powered by Gemini 3 Flash</span>
         </div>

         <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 animate-slide-up leading-tight">
            Architect Complex Systems <br className="hidden md:block"/>
            at the Speed of Thought.
         </h1>
         
         <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            The intelligent canvas for modern engineering. Diagram microservices, cloud infrastructure, 
            and data workflows with code-first precision and AI assistance.
         </p>

         <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button 
                onClick={() => onNavigate('app')}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all duration-300 overflow-hidden"
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
      </div>

      {/* Hero Image / Preview */}
      <div className="max-w-6xl mx-auto px-6 mb-32 relative z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm">
            <div className="rounded-xl overflow-hidden border border-white/5 bg-[#09090b] aspect-[16/9] md:aspect-[21/9] flex items-center justify-center relative group cursor-default">
                 {/* Decorative Grid */}
                 <div className="absolute inset-0 opacity-20" 
                      style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                 </div>
                 
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b] z-10"></div>
                 
                 {/* Code Preview */}
                 <div className="absolute left-0 top-0 bottom-0 w-1/3 border-r border-white/5 bg-[#09090b]/80 p-6 font-mono text-xs hidden md:block text-left overflow-hidden opacity-80">
                    <div className="flex gap-1.5 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                    <span className="text-purple-400">graph</span> <span className="text-orange-400">TB</span><br/>
                    &nbsp;&nbsp;<span className="text-blue-400">User</span>((User)) <span className="text-cyan-400">--></span>|<span className="text-emerald-400">HTTPS</span>| <span className="text-blue-400">CDN</span>[Cloudflare]<br/>
                    &nbsp;&nbsp;<span className="text-blue-400">CDN</span> <span className="text-cyan-400">--></span> <span className="text-blue-400">LB</span>[Load Balancer]<br/>
                    <br/>
                    &nbsp;&nbsp;<span className="text-purple-400">subgraph</span> <span className="text-blue-400">Cluster_A</span><br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">LB</span> <span className="text-cyan-400">--></span> <span className="text-blue-400">API</span>[API Gateway]<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">API</span> <span className="text-cyan-400">--></span> <span className="text-blue-400">Auth</span>[Auth Service]<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">API</span> <span className="text-cyan-400">--></span> <span className="text-blue-400">Core</span>[Core Service]<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">Core</span> <span className="text-cyan-400">-.-></span> <span className="text-blue-400">Cache</span>[(Redis)]<br/>
                    &nbsp;&nbsp;<span className="text-purple-400">end</span>
                 </div>

                 {/* Visual Preview Overlay */}
                 <div className="z-20 text-center relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-6 backdrop-blur-md">
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Architect Active</span>
                    </div>
                    
                    <div className="flex justify-center gap-8 opacity-90 blur-[0.5px]">
                         {/* Abstract Diagram Nodes for visual effect */}
                         <div className="w-16 h-16 rounded-full border-2 border-indigo-500 bg-indigo-500/20 flex items-center justify-center animate-pulse-slow">
                             <Globe className="w-6 h-6 text-indigo-400" />
                         </div>
                         <div className="w-16 h-16 rounded-lg border-2 border-purple-500 bg-purple-500/20 flex items-center justify-center">
                             <Server className="w-6 h-6 text-purple-400" />
                         </div>
                         <div className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                             <Database className="w-6 h-6 text-emerald-400" />
                         </div>
                    </div>
                    
                    <div className="mt-8">
                         <button onClick={() => onNavigate('app')} className="px-6 py-3 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-xl">
                            Open in Studio
                         </button>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Value Prop / Features */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
         <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern Engineering</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                Stop fighting with drag-and-drop tools. Treat your architecture like code.
            </p>
         </div>
         
         <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
                icon={<Code2 className="w-6 h-6 text-indigo-400" />}
                title="Code-First Diagrams"
                desc="Write standard Mermaid.js code or let AI generate it. Version control your diagrams alongside your source code."
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
                title="Git-Friendly"
                desc="Text-based diagrams mean you can finally diff your architecture changes in Pull Requests."
            />
            <FeatureCard 
                icon={<Globe className="w-6 h-6 text-blue-400" />}
                title="Global Gallery"
                desc="Don't start from scratch. Fork proven architectures from engineers at Netflix, Uber, and Airbnb."
            />
            <FeatureCard 
                icon={<Shield className="w-6 h-6 text-amber-400" />}
                title="Enterprise Ready"
                desc="Self-hostable, RBAC support, and SSO integration for teams that need security and compliance."
            />
         </div>
      </div>
      
      {/* Use Cases Section */}
      <div id="use-cases" className="bg-zinc-900/30 py-24 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-6">
             <div className="grid md:grid-cols-2 gap-16 items-center">
                 <div>
                     <h2 className="text-3xl md:text-4xl font-bold mb-6">From Idea to Infrastructure</h2>
                     <div className="space-y-6">
                         <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                 <Server className="w-5 h-5 text-indigo-400" />
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-white">Backend Architecture</h4>
                                 <p className="text-zinc-400 text-sm mt-1">Map out API gateways, microservices, and database relationships before writing a single line of code.</p>
                             </div>
                         </div>
                         <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                                 <Database className="w-5 h-5 text-pink-400" />
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-white">Data Engineering</h4>
                                 <p className="text-zinc-400 text-sm mt-1">Visualize ETL pipelines, data lakes, and streaming workflows using standard flowcharts.</p>
                             </div>
                         </div>
                         <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                 <Cpu className="w-5 h-5 text-emerald-400" />
                             </div>
                             <div>
                                 <h4 className="text-lg font-bold text-white">Machine Learning Ops</h4>
                                 <p className="text-zinc-400 text-sm mt-1">Design training pipelines, inference services, and model registries with specialized templates.</p>
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
                     <div className="relative bg-[#09090b] border border-white/10 rounded-2xl p-8 shadow-2xl">
                         <pre className="text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto">
{`sequenceDiagram
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
    Svc-->>Client: 201 Created`}
                         </pre>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* GEO/SEO FAQ Section - Highly indexable content for LLMs */}
      <div id="faq" className="max-w-4xl mx-auto px-6 py-24 scroll-mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-400">Everything you need to know about AI-powered architecture.</p>
         </div>
         <div className="grid gap-6">
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
      </div>

      {/* CTA */}
      <div className="py-24 px-6 text-center border-t border-white/5">
         <h2 className="text-4xl font-bold mb-6">Ready to upgrade your workflow?</h2>
         <p className="text-zinc-400 mb-8">Join thousands of architects building better systems.</p>
         <button 
            onClick={() => onNavigate('app')}
            className="px-10 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors shadow-2xl shadow-white/10"
        >
            Launch Studio Free
        </button>
      </div>

      {/* Footer */}
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
                    <li><button onClick={() => scrollTo('features')} className="hover:text-indigo-400">Features</button></li>
                    <li><button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400">Community Templates</button></li>
                    <li><button onClick={() => onNavigate('docs')} className="hover:text-indigo-400">Documentation</button></li>
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
                <a href="#" className="hover:text-white transition-colors">GitHub</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">Discord</a>
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
    <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 text-left">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            {question}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed pl-6">{answer}</p>
    </div>
);

export default LandingPage;