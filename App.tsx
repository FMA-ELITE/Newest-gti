
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AcademicLevel, Course, Faculty, EnrollmentData, LibraryItem, NewsItem, ResearchProject, ResearchMessage } from './types';
import { COURSES, FACULTY, LIBRARY_ITEMS, NEWS_ITEMS } from './data';
import { GoogleGenAI } from "@google/genai";
import { ForexIntelligence } from './ForexIntelligence';

// --- AI Service ---
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateInstitutionalVisual = async (prompt: string): Promise<{ data?: string; error?: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Style Guide: Global Trading Institute Branding. Color Palette: Midnight Navy (#001a33), Polished Brass (#b8924a), Marble White. Tone: Prestigious, Institutional, Cinematic, Sharp. Visual Request: ${prompt}. Quality: 8k, Masterpiece, High Contrast.`,
          },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return { data: `data:image/png;base64,${part.inlineData.data}` };
        }
      }
    }
    return { error: "No image data returned from model." };
  } catch (error: any) {
    console.error("AI Image Generation failed:", error);
    
    // Fallback mechanism for quota exceeded or other errors
    const keywords = prompt.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 3).slice(0, 3).join(',');
    const fallbackUrl = `https://images.unsplash.com/photo-1611974717482-480f28a7e58a?auto=format&fit=crop&q=80&w=1200&sig=${Math.random()}`;
    
    // Attempt to get a slightly more relevant image if keywords exist
    const dynamicFallback = keywords ? `https://source.unsplash.com/featured/1600x900?${keywords},institutional,finance` : fallbackUrl;
    
    return { 
      data: dynamicFallback, 
      error: error?.message || "Visual synthesis failed. Using institutional fallback." 
    };
  }
};

const SmartImage: React.FC<{ 
  src: string; 
  alt: string; 
  prompt?: string; 
  className?: string; 
  imgClassName?: string;
}> = ({ src, alt, prompt, className, imgClassName }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleGenerate = React.useCallback(async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    const result = await generateInstitutionalVisual(prompt);
    if (result.data) {
      setCurrentSrc(result.data);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsGenerating(false);
  }, [prompt, isGenerating]);

  useEffect(() => {
    if (!src && prompt) {
      handleGenerate();
    }
  }, [src, prompt, handleGenerate]);

  return (
    <div className={`relative overflow-hidden group bg-slate-100 ${className}`}>
      {isGenerating && (
        <div className="absolute inset-0 bg-primary/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
          <span className="material-symbols-outlined spin text-accent text-4xl mb-3">account_balance</span>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Synthesizing...</span>
        </div>
      )}
      <img 
        src={currentSrc || undefined} 
        alt={alt} 
        onError={() => setHasError(true)} 
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isGenerating || !currentSrc ? 'opacity-0' : 'opacity-100'} ${imgClassName || ''}`} 
      />
      {prompt && !isGenerating && !hasError && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
          <button onClick={handleGenerate} className="bg-accent/90 hover:bg-accent text-white px-6 py-3 rounded-none shadow-2xl transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="text-[9px] font-black uppercase tracking-widest">Enhance Visual</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar: React.FC<{ onNavigate: (page: string) => void; currentPage: string; isAdmin: boolean }> = ({ onNavigate, currentPage, isAdmin }) => {
  const navItems = [
    { id: 'home', label: 'Institutional' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'library', label: 'Library' },
    { id: 'forex', label: 'Forex Intelligence' },
    { id: 'research', label: 'Research Lab' },
    { id: 'portal', label: 'Portal' },
  ];
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel' });
  }
  return (
    <nav className="sticky top-0 z-[100] bg-primary/95 backdrop-blur-md border-b border-accent/20 px-8 py-6 flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('home')}>
        <span className="material-symbols-outlined text-accent text-3xl">account_balance</span>
        <div className="flex flex-col">
          <span className="text-white font-display font-bold text-lg leading-none tracking-tighter">GLOBAL TRADING</span>
          <span className="text-accent text-[9px] font-black tracking-[0.4em] uppercase">Institute</span>
        </div>
      </div>
      <div className="hidden lg:flex gap-8 xl:gap-12">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-accent relative py-1 ${currentPage === item.id ? 'text-accent border-b border-accent' : 'text-gray-400'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <button onClick={() => onNavigate('admissions')} className="hidden md:block bg-accent/10 border border-accent/40 text-accent px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95">ADMISSIONS</button>
    </nav>
  );
};

const ResearchLab: React.FC = () => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'video'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'group'>('date');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<string | null>(null);
  const [isGeneratingMoodBoard, setIsGeneratingMoodBoard] = useState(false);
  const [currentPromptPhase, setCurrentPromptPhase] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = 'gti_research_workbench_v3';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeProjectId, projects, isThinking, activeTab]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => 
      p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || 
      p.topic.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      p.group.toLowerCase().includes(sidebarSearch.toLowerCase())
    );

    if (sortBy === 'date') result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'group') result.sort((a, b) => a.group.localeCompare(b.group));

    return result;
  }, [projects, sidebarSearch, sortBy]);

  const groupedProjects = useMemo(() => {
    const groups: { [key: string]: ResearchProject[] } = {};
    filteredProjects.forEach(p => {
      const g = p.group || 'General Research';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProjects]);

  const startNewProject = () => {
    const newProj: ResearchProject = {
      id: crypto.randomUUID(),
      name: `New Synthesis ${projects.length + 1}`,
      group: 'Development',
      topic: '',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setActiveTab('chat');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeProjectId || isThinking) return;

    const currentMsg = chatInput;
    setChatInput('');
    setIsThinking(true);

    const userMessage: ResearchMessage = {
      role: 'user',
      text: currentMsg,
      timestamp: new Date().toISOString(),
    };

    const updatedProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          messages: [...p.messages, userMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    setProjects(updatedProjects);

    try {
      const ai = getAI();
      const currentProj = updatedProjects.find(p => p.id === activeProjectId)!;
      
      const history = currentProj.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: history as any,
        config: {
          systemInstruction: `You are the Lead Researcher at GTI. Provide institutional market analysis. Help the user build their thesis.`,
          thinkingConfig: { thinkingBudget: 15000 }
        }
      });

      const modelMessage: ResearchMessage = {
        role: 'model',
        text: response.text || "Security uplink saturated.",
        timestamp: new Date().toISOString(),
      };

      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            messages: [...p.messages, modelMessage],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateMoodBoard = async () => {
    if (!activeProject || isGeneratingMoodBoard) return;
    setIsGeneratingMoodBoard(true);
    setCurrentPromptPhase("Analyzing Metadata...");

    try {
      const ai = getAI();
      const discourseHistory = activeProject.messages.slice(-5).map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n');
      
      // Step 1: Automatically construct a detailed, thematic prompt using Gemini 3 Flash
      setCurrentPromptPhase("Constructing Thematic Prompt...");
      const promptSynthesisResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert prompt engineer for a high-end AI image generator. 
        Synthesize a detailed 60-word visual prompt for an institutional mood board.
        Project Name: ${activeProject.name}
        Research Group: ${activeProject.group}
        Core Topic: ${activeProject.topic}
        Recent Discourse Context: ${discourseHistory.slice(0, 500)}
        
        The prompt should focus on a prestigious, cinematic financial aesthetic. 
        Think: high-end data crystals, golden network filaments, architectural blueprint overlays, obsidian surfaces, and sharp digital nodes.
        DO NOT use forbidden words like "moodboard". Describe the scene's texture, lighting, and conceptual depth.`,
        config: { temperature: 0.8 }
      });

      const refinedPrompt = promptSynthesisResponse.text || `Prestigious institutional visual for ${activeProject.name}. ${activeProject.group} research focus. Global market architecture.`;
      
      // Step 2: Generate the actual image using the synthesized prompt
      setCurrentPromptPhase("Synthesizing Visual Layer...");
      const result = await generateInstitutionalVisual(refinedPrompt);
      
      if (result.data) {
        setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            return { ...p, moodBoardUrl: result.data, updatedAt: new Date().toISOString() };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error("Mood Board generation failed:", e);
    } finally {
      setIsGeneratingMoodBoard(false);
      setCurrentPromptPhase(null);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoUrl.trim() || isThinking) return;
    setIsThinking(true);
    setVideoAnalysisResult(null);

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Research Task: Analyze the following institutional media asset: ${videoUrl}. Extract the core market thesis, identify key alpha indicators mentioned, and assess the systemic risk implications. Format as a formal academic summary.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      setVideoAnalysisResult(response.text || "Deconstruction failed.");
    } catch (e) {
      console.error(e);
      setVideoAnalysisResult("Terminal connection error during media analysis.");
    } finally {
      setIsThinking(false);
    }
  };

  const saveAnalysisToChat = () => {
    if (!videoAnalysisResult || !activeProjectId) return;

    const entryMessage: ResearchMessage = {
      role: 'model',
      text: `### [MEDIA ANALYSIS REPORT]\nSource: ${videoUrl}\n\n${videoAnalysisResult}`,
      timestamp: new Date().toISOString(),
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          messages: [...p.messages, entryMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    
    setVideoAnalysisResult(null);
    setVideoUrl('');
    setActiveTab('chat');
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this research project?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  };

  const saveMetadata = () => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, name: editName, group: editGroup, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    setIsEditingMetadata(false);
  };

  const openMetadataEditor = () => {
    if (activeProject) {
      setEditName(activeProject.name);
      setEditGroup(activeProject.group);
      setIsEditingMetadata(true);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
      {/* SIDEBAR */}
      <aside className="w-80 bg-primary border-r border-accent/20 flex flex-col flex-shrink-0 z-30">
        <div className="p-6 space-y-4">
          <button onClick={startNewProject} className="w-full bg-accent text-white py-4 px-4 font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 hover:bg-yellow-700 transition-all shadow-xl active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span> New Synthesis
          </button>
          <div className="space-y-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-accent text-sm">search</span>
              <input 
                type="text" placeholder="Filter Memory..." className="w-full bg-white/5 border border-white/10 pl-10 pr-3 py-3 text-[10px] text-white focus:border-accent outline-none placeholder:text-white/20"
                value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500">Sort</span>
              <select className="bg-transparent border-none p-0 text-[8px] font-black uppercase tracking-widest text-accent hover:text-white outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="date" className="bg-primary">Recent</option>
                <option value="name" className="bg-primary">A-Z</option>
                <option value="group" className="bg-primary">Group</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-3 pb-10 space-y-6">
          {groupedProjects.map(([gName, items]) => (
            <div key={gName}>
              <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/30"></span> {gName}
              </h5>
              <div className="space-y-1">
                {items.map(p => (
                  <div key={p.id} onClick={() => setActiveProjectId(p.id)} className={`group flex items-center justify-between p-4 cursor-pointer transition-all border-l-2 relative ${activeProjectId === p.id ? 'bg-white/10 border-accent' : 'border-transparent hover:bg-white/5'}`}>
                    <div className="truncate flex-grow pr-4">
                      <h4 className={`text-[11px] font-bold truncate leading-tight ${activeProjectId === p.id ? 'text-white' : 'text-gray-300'}`}>{p.name}</h4>
                      <span className="text-[7px] text-gray-500 font-mono mt-1 block">{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <button onClick={(e) => deleteProject(p.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1"><span className="material-symbols-outlined text-xs">close</span></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col bg-marble relative z-20 overflow-hidden">
        {activeProject ? (
          <>
            <header className="z-20 bg-white border-b border-gray-100 shadow-sm p-6 flex justify-between items-center">
              <div className="flex-grow pr-8 cursor-pointer group/hdr" onClick={openMetadataEditor}>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-primary tracking-tight group-hover/hdr:text-accent transition-colors">{activeProject.name}</h2>
                  <span className="bg-accent/10 text-accent text-[8px] font-black uppercase px-2 py-1 tracking-widest border border-accent/20">{activeProject.group}</span>
                </div>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-none mr-8">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('chat')} 
                  className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                >
                  Synthesis
                </button>
                <button 
                  onClick={() => setActiveTab('video')} 
                  className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                >
                  Media Analysis
                </button>
              </div>
              <div className="flex gap-4">
                <button className="text-gray-400 hover:text-primary transition-colors" onClick={openMetadataEditor}><span className="material-symbols-outlined text-xl">settings</span></button>
              </div>
            </header>

            <div className="flex-grow overflow-y-auto relative custom-scrollbar bg-hero-texture">
              {activeTab === 'overview' && (
                <div className="max-w-4xl mx-auto p-12 animate-in fade-in duration-700">
                  <div className="bg-white border border-gray-100 p-10 shadow-2xl relative overflow-hidden group/mb">
                    {activeProject.moodBoardUrl ? (
                      <div className="space-y-10">
                         <div className="relative aspect-video overflow-hidden border border-gray-100 shadow-xl">
                            <img src={activeProject.moodBoardUrl || undefined} alt="Project Mood Board" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-[30s] hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/mb:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                              <span className="material-symbols-outlined text-white text-5xl mb-4">auto_awesome</span>
                              <p className="text-white font-serif italic text-lg mb-8 max-w-sm">Re-synthesize the institutional visual layer based on the latest discourse.</p>
                              <button 
                                onClick={handleGenerateMoodBoard}
                                disabled={isGeneratingMoodBoard}
                                className="bg-accent text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-yellow-700 transition-all active:scale-95"
                              >
                                <span className="material-symbols-outlined text-sm">{isGeneratingMoodBoard ? 'sync' : 'refresh'}</span>
                                {isGeneratingMoodBoard ? 'Synthesizing...' : 'Regenerate Institutional Visual'}
                              </button>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-10 border-t border-gray-50 pt-10">
                            <div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-3">
                                 <span className="material-symbols-outlined text-xs">database</span> Academic Metadata
                               </h4>
                               <div className="space-y-6 text-sm font-serif italic text-gray-600">
                                  <div className="flex flex-col">
                                    <span className="font-sans font-black uppercase text-[8px] text-primary not-italic tracking-[0.3em] mb-1">Genesis Date</span>
                                    <span>{new Date(activeProject.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-sans font-black uppercase text-[8px] text-primary not-italic tracking-[0.3em] mb-1">Synthesis Magnitude</span>
                                    <span>{activeProject.messages.length} Bits of Information</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-sans font-black uppercase text-[8px] text-primary not-italic tracking-[0.3em] mb-1">Thematic Focus</span>
                                    <span>{activeProject.topic || 'General Institutional Study'}</span>
                                  </div>
                               </div>
                            </div>
                            <div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-3">
                                 <span className="material-symbols-outlined text-xs">verified</span> Classification
                               </h4>
                               <div className="flex flex-wrap gap-3">
                                  <span className="inline-block bg-primary text-accent text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-primary">TYPE_RESEARCH</span>
                                  <span className="inline-block bg-marble text-primary text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-100">LEVEL_MASTERS</span>
                                  <span className="inline-block bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-accent/20">STATUS_PERSISTENT</span>
                               </div>
                               <div className="mt-10 p-6 bg-marble border border-gray-100 font-serif italic text-xs text-gray-400 leading-relaxed">
                                 This research project is encrypted and stored within the institutional ledger. Local storage hash active.
                               </div>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="py-48 flex flex-col items-center justify-center text-center relative">
                        <div className="absolute inset-0 bg-hero-texture opacity-20"></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <span className="material-symbols-outlined text-accent text-8xl mb-12 animate-pulse">account_balance</span>
                          <h3 className="font-display text-5xl font-bold text-primary mb-6 tracking-tighter">Generate Project Visual</h3>
                          <p className="font-serif italic text-xl max-w-lg mx-auto leading-relaxed text-gray-500 mb-14">The institutional engine will synthesize a unique mood board by deconstructing your research trajectory, topic, and metadata.</p>
                          
                          <button 
                            onClick={handleGenerateMoodBoard}
                            disabled={isGeneratingMoodBoard}
                            className={`min-w-[320px] h-20 bg-primary text-white font-black uppercase tracking-[0.5em] text-[10px] hover:bg-accent transition-all shadow-2xl flex items-center justify-center gap-6 active:scale-95 ${isGeneratingMoodBoard ? 'opacity-90' : ''}`}
                          >
                            {isGeneratingMoodBoard ? (
                              <>
                                <span className="material-symbols-outlined spin text-xl">sync</span>
                                <div className="flex flex-col items-start leading-none">
                                  <span className="mb-1">Constructing...</span>
                                  <span className="text-[7px] opacity-40 lowercase tracking-widest">{currentPromptPhase}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-xl">palette</span>
                                Initiate Visual Synthesis
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="max-w-4xl mx-auto p-12 space-y-12 pb-32">
                  {activeProject.messages.length === 0 && (
                    <div className="py-32 text-center opacity-30">
                       <span className="material-symbols-outlined text-accent text-8xl mb-12 animate-pulse">cognition</span>
                       <h3 className="font-display text-4xl font-bold text-primary mb-8 tracking-tighter">Academic Synthesis Ready</h3>
                       <p className="font-serif italic text-xl">Start your inquiry to begin populating the institutional record.</p>
                    </div>
                  )}
                  {activeProject.messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-700`}>
                      <div className={`max-w-[85%] flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border shadow-xl ${m.role === 'user' ? 'bg-accent border-accent text-white' : 'bg-primary border-primary text-accent'}`}>
                          <span className="material-symbols-outlined text-xl">{m.role === 'user' ? 'person' : 'terminal'}</span>
                        </div>
                        <div className={`p-10 border shadow-2xl relative ${m.role === 'user' ? 'bg-white border-accent/20 text-primary font-serif italic text-lg' : 'bg-primary text-gray-100 border-primary'} leading-relaxed`}>
                          <div className="whitespace-pre-wrap text-[15px]">{m.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isThinking && <div className="animate-pulse flex items-center gap-4 text-accent font-black uppercase text-[10px] tracking-widest"><span className="material-symbols-outlined spin">sync</span> Processing...</div>}
                  <div ref={chatEndRef} />
                </div>
              )}

              {activeTab === 'video' && (
                <div className="max-w-4xl mx-auto p-12 animate-in fade-in duration-700 pb-32">
                   <div className="bg-white border border-gray-100 p-16 shadow-2xl">
                      <h3 className="font-display text-4xl font-bold text-primary mb-10 tracking-tighter">Media Intelligence Suite</h3>
                      <div className="space-y-8">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Institutional Video URL</label>
                          <input 
                            type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} 
                            placeholder="Enter Bloomberg, Reuters, or YouTube academic link..."
                            className="w-full bg-marble border border-gray-100 p-6 focus:border-accent outline-none font-mono text-sm shadow-inner"
                          />
                        </div>
                        <button 
                          onClick={handleAnalyzeVideo} disabled={isThinking || !videoUrl.trim()}
                          className="w-full bg-primary text-white py-8 font-black uppercase tracking-[0.5em] text-[11px] hover:bg-accent transition-all active:scale-95 disabled:opacity-30"
                        >
                          {isThinking ? 'Analyzing Strategic Content...' : 'Initiate Media Deconstruction'}
                        </button>

                        {videoAnalysisResult && (
                          <div className="mt-12 animate-in slide-in-from-bottom-4 duration-500">
                             <div className="p-12 bg-marble border-l-4 border-accent font-serif text-lg leading-relaxed shadow-xl relative">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-8">Generated Analysis Report</h4>
                                <div className="whitespace-pre-wrap text-gray-700">{videoAnalysisResult}</div>
                                <button 
                                  onClick={saveAnalysisToChat}
                                  className="mt-12 w-full bg-accent text-white py-5 font-black uppercase tracking-widest text-[10px] hover:bg-yellow-700 transition-colors"
                                >
                                  Save to Project Memory
                                </button>
                             </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {activeTab === 'chat' && (
              <div className="p-10 bg-white border-t border-gray-100 z-10 shadow-2xl">
                <div className="max-w-4xl mx-auto relative group">
                  <textarea 
                    value={chatInput} onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Ask the Institutional Engine..."
                    className="w-full bg-marble border border-gray-200 p-8 pr-24 focus:border-accent outline-none text-xl font-serif italic h-40 resize-none shadow-inner"
                  />
                  <button onClick={handleSendMessage} disabled={!chatInput.trim() || isThinking} className="absolute bottom-10 right-10 w-16 h-16 bg-primary text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-2xl disabled:opacity-10 border border-white/10"><span className="material-symbols-outlined text-3xl">north</span></button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-20 text-center relative">
             <div className="institute-seal w-72 h-72 rounded-full flex items-center justify-center mb-16 border-accent/10 relative z-10 shadow-inner">
               <span className="material-symbols-outlined text-accent text-[120px] opacity-20">account_balance</span>
             </div>
             <h2 className="font-display text-8xl font-bold text-primary mb-10 tracking-tighter relative z-10">Research <br/><span className="text-accent italic">Workbench</span></h2>
             <button onClick={startNewProject} className="bg-primary text-white px-24 py-10 font-black uppercase tracking-[0.7em] text-sm hover:bg-accent transition-all shadow-2xl active:scale-95 border border-white/5 relative z-10">
               <span className="material-symbols-outlined">add_circle</span> New Synthesis
             </button>
          </div>
        )}
      </main>

      {isEditingMetadata && activeProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/95 backdrop-blur-md" onClick={() => setIsEditingMetadata(false)}></div>
          <div className="relative bg-white max-w-lg w-full p-12 shadow-2xl border border-accent/20">
            <h3 className="font-display text-2xl font-bold text-primary mb-8 border-b border-gray-100 pb-4">Project Metadata</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Project Identity</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-marble border border-gray-200 p-4 focus:border-accent outline-none text-sm font-serif italic" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Thematic Grouping</label>
                <input type="text" value={editGroup} onChange={e => setEditGroup(e.target.value)} className="w-full bg-marble border border-gray-200 p-4 focus:border-accent outline-none text-sm font-serif italic" />
              </div>
              <div className="pt-6 flex gap-4">
                <button onClick={saveMetadata} className="flex-grow bg-primary text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-lg">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Footer: React.FC<{ isAdmin: boolean; onToggleAdmin: () => void }> = ({ isAdmin, onToggleAdmin }) => (
  <footer className="bg-primary pt-32 pb-48 border-t border-accent/20 z-10 relative">
    <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
      <div className="flex items-center gap-4 mb-10">
        <span className="material-symbols-outlined text-accent text-5xl">account_balance</span>
        <div className="flex flex-col items-start">
          <span className="text-white font-display font-bold text-3xl tracking-tighter">GLOBAL TRADING</span>
          <span className="text-accent text-[11px] font-black tracking-[0.6em] uppercase">Institute</span>
        </div>
      </div>
      <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8">© 2024 Global Trading Institute. All Rights Reserved. Regulated Academic Entity.</p>
      <button 
        onClick={onToggleAdmin}
        className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/30 hover:text-accent transition-all"
      >
        {isAdmin ? 'Deactivate Admin Rights' : 'Request Admin Access'}
      </button>
    </div>
  </footer>
);

const AIAssistant: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, image?: string}[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsThinking(true);
        try {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: userMsg,
                config: { 
                  systemInstruction: `You are the GTI Dean of Studies. Provide elite academic insights.`, 
                  tools: [{ googleSearch: {} }], 
                  thinkingConfig: { thinkingBudget: 24576 } 
                }
            });
            setMessages(prev => [...prev, { role: 'model', text: response.text || "Synchronisation interrupted." }]);
        } catch (error) { setMessages(prev => [...prev, { role: 'model', text: "Security synchronization failed." }]); }
        finally { setIsThinking(false); }
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-10 z-[80] bg-accent text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 border-4 border-white">
              <span className="material-symbols-outlined text-4xl">neurology</span>
            </button>
            {isOpen && (
                <div className="fixed bottom-48 right-10 w-[calc(100vw-4rem)] md:w-[500px] h-[750px] max-h-[85vh] z-[90] bg-primary border border-accent/40 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
                    <div className="p-8 bg-slate-950 border-b border-accent/20 flex justify-between items-center">
                        <h3 className="text-white font-display font-bold text-xl">Office of the Dean</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-8 bg-slate-900 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[90%] p-8 text-sm leading-relaxed ${m.role === 'user' ? 'bg-accent/10 border border-accent/20 text-white font-serif italic' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 bg-slate-950 border-t border-accent/20">
                        <div className="flex gap-4">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Consult the Academic Office..." className="flex-grow bg-white/5 border border-white/10 p-5 text-white text-sm focus:border-accent outline-none font-serif italic" />
                            <button onClick={handleSend} className="bg-accent text-white px-8 rounded-none hover:bg-yellow-700 transition-all"><span className="material-symbols-outlined">send</span></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const LiveStockTicker: React.FC = () => {
  const [stocks, setStocks] = useState([
    { symbol: 'BTC/USD', price: '68,432.10', change: '+2.4%', isUp: true },
    { symbol: 'EUR/USD', price: '1.0842', change: '-0.12%', isUp: false },
    { symbol: 'XAU/USD', price: '2,154.50', change: '+0.8%', isUp: true },
    { symbol: 'SPX', price: '5,123.40', change: '+0.45%', isUp: true },
    { symbol: 'ETH/USD', price: '3,842.15', change: '+3.1%', isUp: true },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const flux = (Math.random() - 0.5) * 0.0004;
        const newPrice = parseFloat(s.price.replace(/,/g, '')) * (1 + flux);
        return { ...s, price: newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), isUp: flux >= 0 };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary border-t border-accent/30 z-[95] overflow-hidden py-4 shadow-2xl backdrop-blur-md">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...stocks, ...stocks].map((s, i) => (
          <div key={i} className="inline-flex items-center gap-8 px-20 border-r border-white/5">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 font-sans">{s.symbol}</span>
            <span className="text-white font-mono text-[13px] font-bold tracking-tight">{s.price}</span>
            <span className={`text-[10px] font-black ${s.isUp ? 'text-green-400' : 'text-red-400'}`}>{s.isUp ? '↑' : '↓'} {s.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);
  const [isEnrollConfirmOpen, setIsEnrollConfirmOpen] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libType, setLibType] = useState<string>('');
  const [libTopic, setLibTopic] = useState<string>('');
  
  // User & Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; enrolledIds: string[] } | null>(null);
  const [applications, setApplications] = useState<{ name: string; email: string; intent: string; date: string }[]>([]);

  const handleNavigate = (page: string) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const initiateEnrollment = (course: Course) => { 
    if (!user) {
      alert("Please complete your admissions profile first.");
      handleNavigate('admissions');
      return;
    }
    setEnrollingCourse(course); 
    setIsEnrollConfirmOpen(true); 
  };

  const confirmEnrollment = () => { 
    if (enrollingCourse && user) {
      setUser({ ...user, enrolledIds: [...user.enrolledIds, enrollingCourse.id] });
    }
    setIsEnrollConfirmOpen(false); 
    handleNavigate('portal'); 
  };

  const handleAdmission = (name: string, email: string, intent: string) => {
    const newApp = { name, email, intent, date: new Date().toISOString() };
    setApplications(prev => [newApp, ...prev]);
    setUser({ name, email, enrolledIds: [] });
    // If it's the specific admin email, grant rights automatically
    if (email.toLowerCase() === 'forexmasteryacademyug@gmail.com') {
      setIsAdmin(true);
    }
    handleNavigate('portal');
  };

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
    if (!isAdmin) {
      alert("Administrative Rights Granted. Accessing Institutional Oversight Panel.");
    }
  };

  const filteredLibrary = useMemo(() => {
    return LIBRARY_ITEMS.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(libSearch.toLowerCase()) || item.author.toLowerCase().includes(libSearch.toLowerCase());
      const matchesType = libType ? item.type === libType : true;
      const matchesTopic = libTopic ? item.topic === libTopic : true;
      return matchesSearch && matchesType && matchesTopic;
    });
  }, [libSearch, libType, libTopic]);

  const uniqueTypes = useMemo(() => Array.from(new Set(LIBRARY_ITEMS.map(i => i.type))), []);
  const uniqueTopics = useMemo(() => Array.from(new Set(LIBRARY_ITEMS.map(i => i.topic))), []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-accent selection:text-white bg-marble">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} isAdmin={isAdmin} />
      <main className="flex-grow">
        {currentPage === 'home' && (
          <div className="page-transition">
            <header className="relative h-[90vh] flex items-center overflow-hidden bg-primary">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent z-10"></div>
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070" alt="Hall" referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
              </div>
              <div className="relative z-20 max-w-7xl mx-auto px-8 w-full">
                  <h1 className="font-display text-5xl md:text-9xl text-white font-bold leading-[0.9] mb-14 tracking-tighter text-glow">Absolute <br/><span className="italic text-accent">Market Sovereignty</span></h1>
                  <button onClick={() => handleNavigate(user ? 'portal' : 'admissions')} className="bg-accent text-white px-16 py-7 font-black text-xs uppercase tracking-[0.5em] shadow-xl hover:bg-yellow-700 transition-all">
                    {user ? 'Access Portal' : 'Begin Application'}
                  </button>
              </div>
            </header>
            <section className="py-24 md:py-48 bg-marble max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                {COURSES.map((course) => (
                  <div key={course.id} className="group bg-white border border-gray-100 hover:border-accent/50 hover:shadow-2xl transition-all duration-700 flex flex-col">
                    <SmartImage src={course.image} alt={course.title} prompt={course.visualPrompt} className="h-72" />
                    <div className="p-10 flex-grow">
                      <h3 className="font-display text-2xl font-bold text-primary mb-12 leading-tight h-16 line-clamp-2">{course.title}</h3>
                      <button onClick={() => handleNavigate('curriculum')} className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center justify-center gap-4 border-t border-gray-100 pt-10">Course Metadata</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {currentPage === 'curriculum' && (
          <div className="py-32 max-w-7xl mx-auto px-8 page-transition">
            {COURSES.map(course => (
              <div key={course.id} className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start border-b border-gray-100 pb-32 mb-32 last:mb-0">
                <SmartImage src={course.image} alt={course.title} prompt={course.visualPrompt} className="aspect-video shadow-2xl border border-gray-100" />
                <div>
                  <h3 className="font-display text-6xl font-bold mb-10 text-primary leading-[1.1] tracking-tighter">{course.title}</h3>
                  <button onClick={() => initiateEnrollment(course)} className="w-full bg-primary text-white py-8 font-black uppercase tracking-[0.5em] text-xs hover:bg-accent transition-all active:scale-95 shadow-2xl">
                    {user?.enrolledIds.includes(course.id) ? 'Already Enrolled' : 'Enroll Module'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {currentPage === 'faculty' && <FacultyPage />}
        {currentPage === 'library' && (
          <div className="py-32 max-w-7xl mx-auto px-8 page-transition">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
              <input type="text" placeholder="Search archives..." className="w-full max-w-2xl bg-white border border-gray-100 py-6 px-8 text-base focus:border-accent outline-none shadow-sm" value={libSearch} onChange={(e) => setLibSearch(e.target.value)} />
              <div className="flex gap-6">
                <select className="bg-white border border-gray-100 py-4 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-accent" value={libType} onChange={(e) => setLibType(e.target.value)}>
                  <option value="">All Formats</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
              {filteredLibrary.map(item => (
                <div key={item.id} onClick={() => { setSelectedLibraryItem(item); setIsLibraryModalOpen(true); }} className="cursor-pointer group">
                  <SmartImage src={item.coverImage} alt={item.title} prompt={item.visualPrompt} className="aspect-[3/4] shadow-2xl border border-gray-100 group-hover:-translate-y-4 transition-all duration-700" />
                  <h4 className="mt-10 font-display text-2xl font-bold group-hover:text-accent transition-colors leading-tight h-16 overflow-hidden line-clamp-2">{item.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}
        {currentPage === 'forex' && <ForexIntelligence />}
        {currentPage === 'research' && <ResearchLab />}
        {currentPage === 'portal' && <StudentPortal onNavigate={handleNavigate} user={user} />}
        {currentPage === 'admissions' && <AdmissionsPage onSubmit={handleAdmission} />}
        {currentPage === 'admin' && isAdmin && <AdminPortal applications={applications} />}
      </main>
      <AIAssistant onNavigate={handleNavigate} />
      <LiveStockTicker />
      <Footer isAdmin={isAdmin} onToggleAdmin={toggleAdmin} />
      <LibraryItemModal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} item={selectedLibraryItem} />
      <EnrollmentConfirmationModal isOpen={isEnrollConfirmOpen} onClose={() => setIsEnrollConfirmOpen(false)} onConfirm={confirmEnrollment} course={enrollingCourse} />
    </div>
  );
};

const FacultyPage: React.FC = () => (
  <div className="page-transition py-32 max-w-7xl mx-auto px-8">
    <h2 className="font-display text-7xl font-bold text-primary mb-24 tracking-tighter">Institutional <span className="italic text-accent">Faculty</span></h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
      {FACULTY.map((member, i) => (
        <div key={i} className="bg-white border border-gray-100 p-12 shadow-2xl flex flex-col md:flex-row gap-12">
          <SmartImage 
            src={member.image} 
            alt={member.name} 
            prompt={member.visualPrompt} 
            imgClassName="grayscale hover:grayscale-0 transition-all duration-700"
            className="w-full md:w-64 h-80 flex-shrink-0" 
          />
          <div>
            <h3 className="font-display text-3xl font-bold text-primary mb-2">{member.name}</h3>
            <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-6">{member.title}</p>
            <p className="text-gray-600 font-serif italic text-sm mb-8 leading-relaxed">{member.bio}</p>
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary border-b border-gray-50 pb-2">Expertise</h4>
              <p className="text-xs text-gray-500">{member.expertise}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminPortal: React.FC<{ applications: any[] }> = ({ applications }) => (
  <div className="page-transition min-h-screen bg-primary pb-64">
    <header className="pt-32 pb-20 px-8 border-b border-accent/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-6xl font-bold text-white tracking-tighter mb-4 italic text-accent">Institutional Oversight</h2>
        <p className="text-gray-400 font-serif italic text-xl">Administrative Control Panel & Academic Ledger</p>
      </div>
    </header>
    <main className="max-w-7xl mx-auto px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-white/5 border border-white/10 p-12 shadow-2xl">
            <h3 className="font-display text-3xl font-bold text-white tracking-tight mb-12 border-b border-white/5 pb-8">Pending Admissions</h3>
            {applications.length === 0 ? (
              <p className="text-gray-500 font-serif italic text-lg py-12 text-center">No pending strategic applications in the ledger.</p>
            ) : (
              <div className="space-y-8">
                {applications.map((app, i) => (
                  <div key={i} className="bg-white/5 p-8 border border-white/10 hover:border-accent transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-white font-bold text-xl mb-1">{app.name}</h4>
                        <p className="text-accent text-[10px] font-black uppercase tracking-widest">{app.email}</p>
                      </div>
                      <span className="text-gray-500 font-mono text-[9px]">{new Date(app.date).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-400 font-serif italic text-sm leading-relaxed mb-8">"{app.intent}"</p>
                    <div className="flex gap-4">
                      <button className="bg-accent text-white px-8 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-700 transition-all">Ratify</button>
                      <button className="bg-white/5 text-gray-400 px-8 py-2 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Archive</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="space-y-12">
          <section className="bg-accent p-10 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-10 border-b border-white/20 pb-4">System Status</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">AI Core</span>
                <span className="text-white font-mono text-xs font-bold">OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">Ledger Sync</span>
                <span className="text-white font-mono text-xs font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">Security Layer</span>
                <span className="text-white font-mono text-xs font-bold">ENCRYPTED</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
);

const AdmissionsPage: React.FC<{ onSubmit: (name: string, email: string, intent: string) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !intent) {
      alert("All institutional fields are mandatory.");
      return;
    }
    onSubmit(name, email, intent);
  };

  return (
    <div className="page-transition min-h-screen bg-white pb-64">
      <section className="py-48 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-8 text-center bg-marble p-24 shadow-2xl border border-gray-100">
          <h2 className="font-display text-6xl font-bold text-primary mb-16 tracking-tighter">Academic Admissions</h2>
          <form className="space-y-16" onSubmit={handleSubmit}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-gray-200 p-8 focus:border-accent outline-none font-serif italic text-lg" placeholder="Full Legal Identity" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-gray-200 p-8 focus:border-accent outline-none font-serif italic text-lg" placeholder="Institutional Email" />
            <textarea value={intent} onChange={e => setIntent(e.target.value)} className="w-full bg-white border border-gray-200 p-8 focus:border-accent outline-none h-64 font-serif italic text-lg" placeholder="Statement of Strategic Intent..."></textarea>
            <button type="submit" className="w-full bg-primary text-white py-10 font-black uppercase tracking-[0.6em] text-sm hover:bg-accent transition-all shadow-2xl">Submit Formal Application</button>
          </form>
        </div>
      </section>
    </div>
  );
};

const StudentPortal: React.FC<{ onNavigate: (page: string) => void; user: any }> = ({ onNavigate, user }) => {
  const studentData = useMemo(() => {
    if (user) {
      return {
        name: user.name,
        id: `GTI-${Math.floor(1000 + Math.random() * 9000)}-X`,
        level: "Strategic Market Candidate",
        gpa: "N/A",
        credits: `${user.enrolledIds.length * 3} / 60`,
        enrolledCourses: COURSES.filter(c => user.enrolledIds.includes(c.id))
      };
    }
    return {
      name: "Alexander Sterling",
      id: "GTI-8829-X",
      level: "Masters of Quantitative Finance",
      gpa: "3.98",
      credits: "42 / 60",
      enrolledCourses: COURSES.slice(0, 3)
    };
  }, [user]);

  return (
    <div className="page-transition min-h-screen bg-marble pb-64">
      {/* Header Section */}
      <header className="bg-primary pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-texture opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-accent text-white text-[8px] font-black uppercase px-3 py-1 tracking-[0.3em] border border-accent/20">Active Session</span>
              <span className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">ID: {studentData.id}</span>
            </div>
            <h2 className="font-display text-6xl font-bold text-white tracking-tighter mb-4">Welcome, <span className="italic text-accent">{studentData.name}</span></h2>
            <p className="text-gray-400 font-serif italic text-xl">{studentData.level}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <span className="block text-[9px] font-black uppercase tracking-widest text-accent mb-1">Academic GPA</span>
              <span className="text-white font-display text-4xl font-bold tracking-tighter">{studentData.gpa}</span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] font-black uppercase tracking-widest text-accent mb-1">Credits Earned</span>
              <span className="text-white font-display text-4xl font-bold tracking-tighter">{studentData.credits}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-12">
            {/* Enrolled Courses */}
            <section className="bg-white border border-gray-100 shadow-2xl p-12">
              <div className="flex justify-between items-center mb-12 border-b border-gray-50 pb-8">
                <h3 className="font-display text-3xl font-bold text-primary tracking-tight">Active Curriculum</h3>
                <button onClick={() => onNavigate('curriculum')} className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-primary transition-colors">View All Courses</button>
              </div>
              <div className="space-y-8">
                {studentData.enrolledCourses.map(course => (
                  <div key={course.id} className="group flex flex-col md:flex-row gap-8 items-center p-6 hover:bg-slate-50 transition-all border border-transparent hover:border-gray-100">
                    <div className="w-32 h-32 flex-shrink-0">
                      <SmartImage 
                        src={course.image} 
                        alt={course.title} 
                        prompt={course.visualPrompt}
                        imgClassName="grayscale group-hover:grayscale-0 transition-all duration-700" 
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-display text-xl font-bold text-primary mb-2">{course.title}</h4>
                      <div className="flex items-center gap-6">
                        <div className="flex-grow h-1 bg-gray-100 relative">
                          <div className="absolute inset-y-0 left-0 bg-accent w-3/4"></div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">75% Complete</span>
                      </div>
                    </div>
                    <button className="bg-primary text-white px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-accent transition-all">Resume Study</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div onClick={() => onNavigate('forex')} className="group bg-primary p-12 border border-white/5 cursor-pointer hover:bg-accent transition-all duration-500 shadow-2xl">
                <span className="material-symbols-outlined text-white text-5xl mb-8 group-hover:scale-110 transition-transform">terminal</span>
                <h4 className="text-white font-display text-2xl font-bold mb-4 tracking-tight">Trading Terminal</h4>
                <p className="text-white/60 font-serif italic text-sm leading-relaxed">Access the high-frequency Forex Intelligence engine and real-time market data.</p>
              </div>
              <div onClick={() => onNavigate('research')} className="group bg-white p-12 border border-gray-100 cursor-pointer hover:border-accent transition-all duration-500 shadow-2xl">
                <span className="material-symbols-outlined text-primary text-5xl mb-8 group-hover:scale-110 transition-transform">cognition</span>
                <h4 className="text-primary font-display text-2xl font-bold mb-4 tracking-tight">Research Lab</h4>
                <p className="text-gray-500 font-serif italic text-sm leading-relaxed">Continue your quantitative synthesis and collaborate with the GTI Research Lab.</p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            {/* Academic Standing */}
            <section className="bg-white border border-gray-100 shadow-2xl p-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 border-b border-gray-50 pb-4">Academic Standing</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">Attendance</span>
                  <span className="text-accent font-mono text-sm font-bold">98.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">Exam Average</span>
                  <span className="text-accent font-mono text-sm font-bold">A+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">Market Alpha</span>
                  <span className="text-accent font-mono text-sm font-bold">+12.4%</span>
                </div>
              </div>
              <div className="mt-12 p-6 bg-marble border border-gray-100">
                <p className="text-[10px] text-gray-400 font-serif italic leading-relaxed">Your academic standing is currently in the top 1% of the institutional cohort. Elite status maintained.</p>
              </div>
            </section>

            {/* Institutional Notifications */}
            <section className="bg-primary p-10 border border-white/5 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-10 border-b border-white/5 pb-4">Institutional Alerts</h3>
              <div className="space-y-8">
                <div className="border-l-2 border-accent pl-6">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">2 Hours Ago</span>
                  <p className="text-white text-xs font-serif italic leading-relaxed">New quantitative research paper published in the GTI Library: "Neural Networks in FX Arbitrage".</p>
                </div>
                <div className="border-l-2 border-white/10 pl-6">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Yesterday</span>
                  <p className="text-white/60 text-xs font-serif italic leading-relaxed">Your enrollment for "Advanced Algorithmic Trading" has been formally ratified.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const LibraryItemModal: React.FC<{ isOpen: boolean, onClose: () => void, item: LibraryItem | null }> = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl rounded-none shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <SmartImage src={item.coverImage} alt={item.title} prompt={item.visualPrompt} className="md:w-1/2 min-h-[500px]" />
          <div className="md:w-1/2 p-16 flex flex-col justify-between bg-marble">
            <div>
              <h2 className="font-display text-5xl font-bold text-primary mb-8 tracking-tighter">{item.title}</h2>
              <p className="text-gray-600 font-serif italic text-xl leading-relaxed mb-10">{item.description}</p>
            </div>
            <button onClick={onClose} className="w-full bg-primary text-white py-6 font-black uppercase tracking-[0.5em] text-[11px] hover:bg-accent transition-all">Close Entry</button>
          </div>
      </div>
    </div>
  );
};

const EnrollmentConfirmationModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, course: Course | null }> = ({ isOpen, onClose, onConfirm, course }) => {
  if (!isOpen || !course) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white max-w-xl w-full p-16 border-t-8 border-accent shadow-2xl animate-in zoom-in duration-300 text-center">
        <h2 className="font-display text-4xl font-bold text-primary mb-6 tracking-tighter">Enrollment Request</h2>
        <div className="bg-marble border border-gray-100 p-10 mb-12">
          <h3 className="text-primary font-bold text-3xl uppercase tracking-tighter mb-4">{course.title}</h3>
        </div>
        <button onClick={onConfirm} className="w-full bg-primary text-white py-6 font-black uppercase tracking-[0.5em] text-xs hover:bg-accent transition-all shadow-2xl">Proceed to Admissions</button>
      </div>
    </div>
  );
};

export default App;
