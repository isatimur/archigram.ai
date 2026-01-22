
import React from 'react';
import { ArrowLeft, Rocket, Shield, FileText, Scale } from 'lucide-react';
import { AppView } from '../types.ts';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'license';
  onNavigate: (view: AppView) => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ type, onNavigate }) => {
  
  const getContent = () => {
      switch(type) {
          case 'privacy':
              return {
                  title: "Privacy Policy",
                  icon: <Shield className="w-6 h-6 text-emerald-400" />,
                  content: (
                      <div className="space-y-6 text-zinc-400">
                          <p>Last Updated: October 26, 2023</p>
                          <p>
                              At ArchiGram.ai, we prioritize your privacy and data security. 
                              This Privacy Policy explains how we handle your information when you use our diagramming tools.
                          </p>
                          
                          <h3 className="text-xl font-bold text-white mt-8">1. Data Collection</h3>
                          <p>
                              ArchiGram.ai operates primarily as a client-side application. 
                              Your diagrams and code are stored locally in your browser's storage (LocalStorage).
                              We do not automatically sync your private diagrams to any cloud server unless you explicitly choose to "Publish" them to the Community Gallery.
                          </p>

                          <h3 className="text-xl font-bold text-white mt-8">2. AI Processing</h3>
                          <p>
                              When you use the AI Copilot features, your prompt text and current diagram code are sent to Google's Gemini API for processing. 
                              This data is used solely to generate the response and is not used to train Google's models by default (subject to Google Cloud's data privacy policies for API usage).
                          </p>

                          <h3 className="text-xl font-bold text-white mt-8">3. Analytics</h3>
                          <p>
                              We use anonymous, aggregate analytics to understand usage patterns (e.g., number of diagrams created, popular templates). 
                              No personally identifiable information (PII) is collected.
                          </p>
                      </div>
                  )
              };
          case 'terms':
              return {
                  title: "Terms of Service",
                  icon: <FileText className="w-6 h-6 text-primary" />,
                  content: (
                      <div className="space-y-6 text-zinc-400">
                          <p>Last Updated: October 26, 2023</p>
                          
                          <h3 className="text-xl font-bold text-white mt-8">1. Acceptance of Terms</h3>
                          <p>
                              By accessing and using ArchiGram.ai, you accept and agree to be bound by the terms and provision of this agreement.
                          </p>

                          <h3 className="text-xl font-bold text-white mt-8">2. Use License</h3>
                          <p>
                              ArchiGram.ai is open-source software. You are free to use the hosted version for personal or commercial diagramming. 
                              However, you may not redistribute the hosted service itself under a different name without attribution.
                          </p>

                          <h3 className="text-xl font-bold text-white mt-8">3. Disclaimer</h3>
                          <p>
                              The materials on ArchiGram.ai are provided "as is". We make no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
                              We do not warrant that the results of the AI generation will be error-free or suitable for critical production systems without human review.
                          </p>
                      </div>
                  )
              };
          case 'license':
              return {
                  title: "Open Source License",
                  icon: <Scale className="w-6 h-6 text-accent" />,
                  content: (
                      <div className="space-y-6 text-zinc-400">
                          <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto">
                              <p className="mb-4">MIT License</p>
                              <p className="mb-4">Copyright (c) 2024 ArchiGram OSS</p>
                              <p className="mb-4">
                                  Permission is hereby granted, free of charge, to any person obtaining a copy
                                  of this software and associated documentation files (the "Software"), to deal
                                  in the Software without restriction, including without limitation the rights
                                  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                  copies of the Software, and to permit persons to whom the Software is
                                  furnished to do so, subject to the following conditions:
                              </p>
                              <p className="mb-4">
                                  The above copyright notice and this permission notice shall be included in all
                                  copies or substantial portions of the Software.
                              </p>
                              <p>
                                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                                  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                                  SOFTWARE.
                              </p>
                          </div>
                          <p>
                              ArchiGram.ai is proud to be open source. You can find our source code on GitHub and contribute to the project.
                          </p>
                      </div>
                  )
              };
      }
  };

  const { title, icon, content } = getContent() || { title: '', icon: null, content: null };

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-white flex flex-col font-sans overflow-y-auto">
      
      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-4">
             <button 
                onClick={() => onNavigate('landing')}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Back to Home"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-6 w-px bg-white/10"></div>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
                 <Rocket className="w-5 h-5 text-indigo-500" />
                 <span className="font-bold text-lg tracking-tight">ArchiGram.ai</span>
             </div>
         </div>
         <button 
            onClick={() => onNavigate('app')}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
         >
            Launch Studio
         </button>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        
        <div className="mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800/50 border border-white/10 mb-6">
                {icon}
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">{title}</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none">
            {content}
        </div>

      </main>

      <footer className="border-t border-white/5 bg-[#050507] py-8 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} ArchiGram.ai OSS. Built for Engineers.</p>
        <a href="https://beyond9to6.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors text-xs opacity-70 hover:opacity-100">
            A Project by <span className="font-bold underline decoration-dotted decoration-zinc-600 underline-offset-2">Beyond 9to6</span>
        </a>
      </footer>
    </div>
  );
};

export default LegalPage;
