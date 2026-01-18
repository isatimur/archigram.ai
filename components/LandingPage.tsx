import React from 'react';
import { LayoutTemplate, ArrowRight, Zap, CheckCircle2, Cpu, Share2, Shield } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="h-screen w-screen bg-[#09090b] text-white overflow-y-auto overflow-x-hidden landing-grid relative font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LayoutTemplate className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight">Archigram<span className="text-indigo-400">.ai</span></h1>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">Enterprise Edition</p>
             </div>
         </div>
         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
         </div>
         <button 
            onClick={onLaunch}
            className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
         >
            Launch App
         </button>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
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
                onClick={onLaunch}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>
            <button className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
                View Demo
            </button>
         </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
         <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
                icon={<Cpu className="w-6 h-6 text-indigo-400" />}
                title="Gemini 3 Native"
                desc="Describe your system in plain English. Our engine leverages Gemini 3 Flash for sub-second diagram generation."
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
         </div>
      </div>

      {/* Social Proof / Trusted By */}
      <div className="border-t border-white/5 py-12 text-center">
         <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest mb-8">Trusted by Architects at</p>
         <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
             {/* Fake Logos for effect */}
             <span className="text-xl font-bold font-sans">ACME Corp</span>
             <span className="text-xl font-bold font-serif">Globex</span>
             <span className="text-xl font-bold font-mono">Soylent</span>
             <span className="text-xl font-bold font-sans tracking-tighter">Initech</span>
             <span className="text-xl font-bold font-serif italic">Umbrella</span>
         </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Archigram.ai. All rights reserved.</p>
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

export default LandingPage;