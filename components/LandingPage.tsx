
import React from 'react';
import { LayoutTemplate, ArrowRight, Zap, CheckCircle2, Cpu, Share2, Shield, Code2, Globe, FileJson, Layers, Command, Rocket, Bot, Database, Server, GitBranch, HelpCircle, Workflow, ChevronDown, Binary, Box } from 'lucide-react';
import { AppView } from '../types.ts';
import { FAQ_DATA } from '../constants.ts';
import LiveDiagramBlock from './LiveDiagramBlock.tsx';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [showTools, setShowTools] = React.useState(false);
  
  const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const HERO_DIAGRAM = `architecture-beta
    group api(logos:aws-lambda)[API Layer]

    service db(logos:aws-aurora)[Aurora DB] in api
    service cache(logos:redis)[Redis Cluster] in api
    service server(logos:aws-ec2)[Compute] in api

    db:L -- R:server
    cache:T -- B:server`;

  // Backend Architecture Diagram for "From Idea to Infrastructure"
  const BACKEND_ARCH_DIAGRAM = `graph TD
    User((User)) -->|HTTPS| CDN[Cloudflare CDN]
    CDN --> LB[Load Balancer]
    
    subgraph VPC [Cloud VPC]
        LB --> Gateway[API Gateway]
        
        subgraph Service_Mesh [Microservices]
            Auth[Auth Service]
            Order[Order API]
            Pay[Payment API]
        end
        
        Gateway --> Auth
        Gateway --> Order
        Gateway --> Pay
        
        Auth -.-> Redis[(Redis Session)]
        Order --> PSQL[(Postgres DB)]
        Pay --> Stripe[Stripe SDK]
    end
    
    style VPC fill:#18181b,stroke:#3f3f46,color:#fff
    style Service_Mesh fill:#27272a,stroke:#3f3f46,color:#fff
    style Gateway fill:#4f46e5,stroke:#fff,color:#fff`;

  // JSON-LD Schema for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_DATA.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white overflow-y-auto overflow-x-hidden relative font-sans scroll-smooth group/landing">
      
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      
      {/* Dynamic Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow z-0"></div>

      {/* Inject JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Semantic Header / Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between transition-all duration-300" role="banner">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-5 h-5 text-white" />
             </div>
             <div>
                <div className="text-xl tracking-tight flex items-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">Archi</span>
                    <span className="text-white font-bold">Gram</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">.ai</span>
                </div>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono leading-none group-hover:text-indigo-400 transition-colors">Intelligent Architecture</p>
             </div>
         </div>
         <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400" role="navigation">
            
            {/* Tools Dropdown */}
            <div className="relative group">
                <button 
                    className="hover:text-white transition-colors flex items-center gap-1 py-4"
                    onMouseEnter={() => setShowTools(true)}
                    onClick={() => setShowTools(!showTools)}
                >
                    Tools <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                
                {/* Dropdown Menu */}
                <div 
                    className={`absolute top-full left-0 w-64 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-left ${showTools ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                    onMouseLeave={() => setShowTools(false)}
                >
                    <div className="p-2 space-y-1">
                        <button onClick={() => onNavigate('app')} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl text-left transition-colors group/item">
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover/item:bg-indigo-500/20 text-indigo-400 transition-colors">
                                <Rocket className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">Mermaid Studio</div>
                                <div className="text-[10px] text-zinc-500">Diagrams as Code</div>
                            </div>
                        </button>
                        <button onClick={() => onNavigate('plantuml')} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl text-left transition-colors group/item">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover/item:bg-emerald-500/20 text-emerald-400 transition-colors">
                                <Binary className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">PlantUML Studio</div>
                                <div className="text-[10px] text-zinc-500">Standard UML Editor</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Platform</button>
            <button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400 text-indigo-200 transition-colors flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Community</button>
            <button onClick={() => scrollTo('use-cases')} className="hover:text-white transition-colors">Use Cases</button>
            <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">Docs</button>
         </nav>
         <div className="flex items-center gap-4">
             <button onClick={() => onNavigate('app')} className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">Sign In</button>
             <button 
                onClick={() => onNavigate('app')}
                className="group relative bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative">Launch Studio</span>
             </button>
         </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-48 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium mb-8 animate-fade-in hover:bg-white/10 transition-colors cursor-default backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="tracking-wide">v0.2 Now Available • Multi-Engine Support</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-600 animate-slide-up leading-[1.1]">
                Architect Systems <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">Like Magic.</span>
            </h1>
            
            <h2 className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed animate-slide-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                The intelligent canvas for modern engineering. Generate <strong>Mermaid.js and PlantUML</strong> diagrams 
                with code-first precision and 100B parameter AI models.
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-5 animate-slide-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                <button 
                    onClick={() => onNavigate('app')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                    aria-label="Start Diagramming Now"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-3">
                        Start Diagramming
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
                <button 
                    onClick={() => onNavigate('gallery')}
                    className="px-8 py-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl font-bold text-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2 hover:border-zinc-700"
                >
                    <Globe className="w-5 h-5" />
                    Explore Gallery
                </button>
            </div>
        </section>

        {/* Live Demo with Floating Effect */}
        <section className="max-w-6xl mx-auto px-6 mb-40 relative z-10 animate-slide-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <div className="relative group perspective-1000">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative rounded-xl bg-[#09090b] ring-1 ring-white/10 shadow-2xl transform transition-transform duration-500 hover:scale-[1.005]">
                    <LiveDiagramBlock 
                        initialCode={HERO_DIAGRAM}
                        title="Interactive Architecture Preview"
                        height="550px"
                        enableZoom={true}
                    />
                </div>
            </div>
            <div className="flex justify-center gap-8 mt-8 text-zinc-500 text-xs font-mono tracking-widest uppercase opacity-70">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Mermaid.js Native</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> PlantUML Support</span>
            </div>
        </section>

        {/* Professional Suites Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="text-center mb-16 relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">Enterprise Modeling Suites</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                    Specialized environments for strict UML compliance and enterprise business process modeling.
                </p>
            </div>

            <div className="flex justify-center relative z-10">
                {/* PlantUML Card */}
                <div 
                    onClick={() => onNavigate('plantuml')}
                    className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 max-w-3xl w-full"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="p-10 flex flex-col md:flex-row gap-10 items-center">
                        <div className="flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Binary className="w-7 h-7" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                                PlantUML Studio
                                <ArrowRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-400" />
                            </h3>
                            <p className="text-zinc-400 mb-8 text-lg leading-relaxed">
                                The industry standard for textual UML. Generate Sequence, Use Case, Class, and Component diagrams using the powerful PlantUML syntax.
                            </p>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="bg-[#050507] rounded-xl p-5 border border-white/10 font-mono text-xs text-emerald-300/80 opacity-80 group-hover:opacity-100 transition-opacity shadow-inner">
                                @startuml<br/>
                                Alice -> Bob: Authentication Request<br/>
                                Bob --> Alice: Authentication Response<br/>
                                @enduml
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 scroll-mt-20">
            <div className="text-center mb-24">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Engineered for Engineers</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                    Stop fighting with UI tools. Treat your system design like you treat your code.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
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
        
        {/* Use Cases Section */}
        <section id="use-cases" className="bg-zinc-900/30 py-32 border-y border-white/5 relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-20 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">From Idea to <br/>Infrastructure</h2>
                        <div className="space-y-8">
                            <article className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                    <Server className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">Backend Architecture</h3>
                                    <p className="text-zinc-400 text-base mt-2 leading-relaxed">Map out API gateways, microservices, and database relationships (ERD) before writing a single line of code.</p>
                                </div>
                            </article>
                            <article className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20 group-hover:bg-pink-500/20 transition-colors">
                                    <Database className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">Data Engineering Pipelines</h3>
                                    <p className="text-zinc-400 text-base mt-2 leading-relaxed">Visualize ETL pipelines, data lakes, and streaming workflows (Kafka/Flink) using standard flowcharts.</p>
                                </div>
                            </article>
                            <article className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                    <Cpu className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Machine Learning Ops (MLOps)</h3>
                                    <p className="text-zinc-400 text-base mt-2 leading-relaxed">Design training pipelines, inference services, and model registries with specialized templates.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl transform rotate-3"></div>
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                             <LiveDiagramBlock 
                                initialCode={BACKEND_ARCH_DIAGRAM} 
                                title="Backend Architecture Preview"
                                height="550px"
                                enableZoom={true}
                             />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-32 scroll-mt-20">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-zinc-400">Everything you need to know about AI-powered architecture.</p>
            </div>
            <div className="grid gap-6" itemScope itemType="https://schema.org/FAQPage">
                {FAQ_DATA.map((item, index) => (
                    <FaqItem 
                        key={index}
                        question={item.question} 
                        answer={item.answer} 
                    />
                ))}
            </div>
            <div className="mt-16 text-center">
                <button 
                    onClick={() => onNavigate('faq')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2 mx-auto transition-colors group"
                >
                    View All FAQs
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 text-center border-t border-white/5 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="relative z-10">
                <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">Ready to upgrade your workflow?</h2>
                <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">Join thousands of architects building better systems with AI assistance.</p>
                <button 
                    onClick={() => onNavigate('app')}
                    className="px-12 py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-105"
                >
                    Launch Studio Free
                </button>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050507] py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <Rocket className="w-6 h-6 text-indigo-500" />
                    <span className="font-bold text-xl">ArchiGram.ai</span>
                </div>
                <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                    The open-source standard for architecture diagramming. 
                    Built by engineers, for engineers. Empowering the next generation of system design.
                </p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => scrollTo('features')} className="hover:text-indigo-400 transition-colors">AI Features</button></li>
                    <li><button onClick={() => onNavigate('gallery')} className="hover:text-indigo-400 transition-colors">Community Templates</button></li>
                    <li><button onClick={() => onNavigate('docs')} className="hover:text-indigo-400 transition-colors">Mermaid.js Documentation</button></li>
                </ul>
            </div>
             <div>
                <h4 className="text-white font-bold mb-6">Legal</h4>
                <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => onNavigate('privacy')} className="hover:text-indigo-400 transition-colors">Privacy Policy</button></li>
                    <li><button onClick={() => onNavigate('terms')} className="hover:text-indigo-400 transition-colors">Terms of Service</button></li>
                    <li><button onClick={() => onNavigate('license')} className="hover:text-indigo-400 transition-colors">Open Source License</button></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2">
                <p>&copy; {new Date().getFullYear()} ArchiGram.ai OSS.</p>
                <span className="hidden md:block text-zinc-800">•</span>
                <a href="https://beyond9to6.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                    Part of <span className="font-bold text-zinc-500 group-hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-700">Beyond 9to6</span>
                </a>
            </div>
            <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">GitHub</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">Twitter</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Discord">Discord</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner group-hover:border-indigo-500/20">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-zinc-400 text-base leading-relaxed">{desc}</p>
    </div>
);

interface FaqItemProps {
    question: string;
    answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-left hover:border-indigo-500/20 transition-colors" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3" itemProp="name">
            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
            {question}
        </h3>
        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
             <p className="text-zinc-400 text-base leading-relaxed pl-8 border-l-2 border-white/5 ml-2.5" itemProp="text">{answer}</p>
        </div>
    </div>
);

export default LandingPage;
