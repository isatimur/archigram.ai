import React from 'react';
import { LayoutTemplate, ArrowRight, Zap, CheckCircle2, Cpu, Share2, Shield, Code2, Globe, FileJson, Layers, Command } from 'lucide-react';
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
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LayoutTemplate className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight"><span className="text-indigo-400">Archi</span>Gram<span className="text-indigo-400">.ai</span></h1>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">Enterprise Edition</p>
             </div>
         </div>
         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('solutions')} className="hover:text-white transition-colors">Solutions</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">Docs</button>
         </div>
         <div className="flex items-center gap-4">
             <button onClick={() => onNavigate('app')} className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white">Sign In</button>
             <button 
                onClick={() => onNavigate('app')}
                className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
                Launch App
             </button>
         </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            <span>Powered by Gemini 3 Flash</span>
         </div>

         <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 animate-slide-up">
            Architecture at the <br className="hidden md:block"/>
            Speed of Thought.
         </h1>
         
         <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            The professional diagramming suite for technical architects. 
            Combine the power of Mermaid.js with Gemini 3 Flash to generate, 
            iterate, and manage complex systems in seconds.
         </p>

         <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button 
                onClick={() => onNavigate('app')}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>
            <button 
                onClick={() => scrollTo('features')}
                className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
                Learn More
            </button>
         </div>
      </div>

      {/* Hero Image / Preview */}
      <div className="max-w-6xl mx-auto px-6 mb-32 relative z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-2 shadow-2xl shadow-indigo-500/10">
            <div className="rounded-xl overflow-hidden border border-white/5 bg-[#09090b] aspect-[16/9] flex items-center justify-center relative group cursor-default">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#09090b]/80 z-10"></div>
                 <pre className="text-xs font-mono text-zinc-600 absolute left-6 top-6 opacity-50">
{`sequenceDiagram
    participant User
    participant System
    User->>System: Login
    System-->>User: 200 OK`}
                 </pre>
                 <div className="z-20 text-center">
                    <p className="text-zinc-500 text-sm font-mono mb-2">Live Preview Engine</p>
                    <button onClick={() => onNavigate('app')} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">Try Interactive Demo</button>
                 </div>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to ship faster.</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Stop wrestling with GUI tools. Code your diagrams or let AI handle the syntax while you focus on the architecture.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<Cpu className="w-6 h-6 text-indigo-400" />}
                title="Gemini 3 Native"
                desc="Describe your system in plain English. Our engine leverages Gemini 3 Flash for sub-second diagram generation."
            />
             <FeatureCard 
                icon={<Code2 className="w-6 h-6 text-pink-400" />}
                title="Code-First Editor"
                desc="Full Mermaid.js syntax support with syntax highlighting, error detection, and line numbers."
            />
            <FeatureCard 
                icon={<Shield className="w-6 h-6 text-emerald-400" />}
                title="Enterprise Storage"
                desc="Secure local persistence for all your projects. Manage multiple diagrams in a unified workspace."
            />
            <FeatureCard 
                icon={<Share2 className="w-6 h-6 text-purple-400" />}
                title="Export & Share"
                desc="One-click export to SVG/PNG for presentations, or share live editable links with your team."
            />
            <FeatureCard 
                icon={<Globe className="w-6 h-6 text-blue-400" />}
                title="C4 Model Support"
                desc="Generate C4 Context, Container, and Component diagrams with specialized prompts."
            />
            <FeatureCard 
                icon={<FileJson className="w-6 h-6 text-amber-400" />}
                title="Versioning"
                desc="Auto-saving and local history ensure you never lose your flow state or your diagram iterations."
            />
         </div>
      </div>

      {/* Solutions / Diagrams */}
      <div id="solutions" className="bg-zinc-900/30 py-24 border-y border-white/5 scroll-mt-20">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-8">
                    <h2 className="text-3xl md:text-4xl font-bold">Supported Diagram Types</h2>
                    <div className="space-y-4">
                        <SolutionItem title="Sequence Diagrams" desc="Visualize API flows, authentications, and system interactions." />
                        <SolutionItem title="Flowcharts" desc="Map out decision trees, user journeys, and complex logic." />
                        <SolutionItem title="Class Diagrams" desc="Model your database schema and object-oriented structures." />
                        <SolutionItem title="State Diagrams" desc="Define lifecycle states for orders, payments, and processes." />
                        <SolutionItem title="Gantt & Pie Charts" desc="Project management visualization baked right in." />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                        <Layers className="w-32 h-32 text-indigo-500/50" />
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400">Start for free, upgrade for power.</p>
         </div>
         <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard 
                title="Community" 
                price="$0" 
                features={['Unlimited Diagrams (Local)', 'Gemini 3 Flash (Limited)', 'SVG Export', 'Standard Themes']}
                cta="Start Building"
                active={false}
                onClick={() => onNavigate('app')}
            />
            <PricingCard 
                title="Pro Architect" 
                price="$19" 
                features={['Everything in Free', 'Gemini 3 Pro Access', 'Unlimited History', 'Priority Support', 'Custom Branding']}
                cta="Go Pro"
                active={true}
                onClick={() => onNavigate('app')}
            />
         </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050507] py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-12">
            <div>
                <h4 className="text-white font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button onClick={() => scrollTo('features')} className="hover:text-indigo-400">Features</button></li>
                    <li><button onClick={() => scrollTo('pricing')} className="hover:text-indigo-400">Pricing</button></li>
                    <li><button onClick={() => onNavigate('docs')} className="hover:text-indigo-400">Documentation</button></li>
                    <li><button onClick={() => onNavigate('app')} className="hover:text-indigo-400">Changelog</button></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Use Cases</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button className="hover:text-indigo-400">Software Architecture</button></li>
                    <li><button className="hover:text-indigo-400">Cloud Infrastructure</button></li>
                    <li><button className="hover:text-indigo-400">Database Design</button></li>
                </ul>
            </div>
             <div>
                <h4 className="text-white font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button className="hover:text-indigo-400">About</button></li>
                    <li><button className="hover:text-indigo-400">Blog</button></li>
                    <li><button className="hover:text-indigo-400">Contact</button></li>
                </ul>
            </div>
             <div>
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li><button className="hover:text-indigo-400">Privacy Policy</button></li>
                    <li><button className="hover:text-indigo-400">Terms of Service</button></li>
                </ul>
            </div>
        </div>
        <div className="text-center text-zinc-600 text-sm">
            <p>&copy; {new Date().getFullYear()} Archigram.ai. Built with Gemini 3.</p>
        </div>
      </footer>
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900 transition-all duration-300 group">
        <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const SolutionItem = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
            <h4 className="text-white font-bold">{title}</h4>
            <p className="text-zinc-500 text-sm">{desc}</p>
        </div>
    </div>
);

const PricingCard = ({ title, price, features, cta, active, onClick }: any) => (
    <div className={`p-8 rounded-2xl border flex flex-col ${active ? 'bg-zinc-900 border-indigo-500/50 relative overflow-hidden' : 'bg-transparent border-white/10'}`}>
        {active && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Recommended</div>}
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-white">{price}</span>
            <span className="text-zinc-500">/month</span>
        </div>
        <ul className="space-y-3 mb-8 flex-1">
            {features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-600'}`} />
                    {f}
                </li>
            ))}
        </ul>
        <button 
            onClick={onClick}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
            {cta}
        </button>
    </div>
);

export default LandingPage;