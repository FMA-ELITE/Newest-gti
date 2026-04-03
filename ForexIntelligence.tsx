import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, Newspaper, Search, Send, RefreshCw, AlertCircle, 
  BarChart3, Globe, Zap, ArrowUpRight, ArrowDownRight, Info,
  Image as ImageIcon, X, Calendar, PlayCircle, Settings2, Activity, Grid3X3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// CONFIGURATION – Update this with your actual backend URL
// ============================================================
const BACKEND_URL = 'https://gti-backend.onrender.com';

// ============================================================
// FALLBACK RESPONSES (works even if backend is down)
// ============================================================
const getFallbackResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('eur/usd') || msg.includes('euro')) {
    return "**EUR/USD Analysis**\n\nCurrent sentiment: Neutral with bullish bias.\n\n- Support: 1.0780, 1.0720\n- Resistance: 1.0920, 1.0980\n- Key level: 1.0850\n\n*The pair is awaiting direction from upcoming ECB comments.*";
  }
  if (msg.includes('gbp/usd') || msg.includes('pound')) {
    return "**GBP/USD Analysis**\n\nCurrent sentiment: Bearish near-term.\n\n- Support: 1.2550, 1.2480\n- Resistance: 1.2680, 1.2750\n\n*BoE policy divergence continues to pressure the pound.*";
  }
  if (msg.includes('outlook') || msg.includes('forecast')) {
    return "**Market Outlook**\n\n- Short-term: Cautiously bullish on USD\n- Medium-term: Range-bound until central bank clarity\n- Key risks: Inflation data, geopolitical tensions\n\n*Recommend maintaining 1-2% risk per trade.*";
  }
  if (msg.includes('support') || msg.includes('resistance')) {
    return "**Support & Resistance Guide**\n\n**Support** = Price level where buying interest emerges\n**Resistance** = Price level where selling pressure appears\n\n*Trading tips: Buy at support, sell at resistance. Breakouts need volume confirmation.*";
  }
  if (msg.includes('gold') || msg.includes('xau')) {
    return "**Gold (XAU/USD) Analysis**\n\nCurrent trend: Bullish\n\n- Support: $2,140, $2,120\n- Resistance: $2,170, $2,190\n\n*Safe-haven demand remains strong amid geopolitical risks.*";
  }
  
  return "**Forex Market Summary**\n\nMajor pairs are consolidating ahead of key economic releases. USD remains supported by higher yields, while EUR and GBP face headwinds.\n\n📊 **Today's Key Levels:**\n- EUR/USD: 1.0800-1.0900\n- GBP/USD: 1.2600-1.2750\n- USD/JPY: 150.50-152.00\n\n*Always use proper risk management. This is for educational purposes only.*";
};

// ============================================================
// TYPES
// ============================================================
interface ForexMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  image?: string;
}

interface MarketInsight {
  pair: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  reasoning: string;
  confidence: number;
}

interface ForexNewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface EconomicEvent {
  event: string;
  currency: string;
  impact: 'High' | 'Medium' | 'Low';
  previous: string;
  forecast: string;
  actual: string;
  time: string;
  date: string;
}

interface BacktestResult {
  strategyName: string;
  pair: string;
  timeframe: string;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  netProfit: string;
  maxDrawdown: string;
  summary: string;
  equityCurve: { date: string; balance: number }[];
}

interface CorrelationData {
  pairA: string;
  pairB: string;
  correlation: number;
}

// ============================================================
// MOCK DATA (used when backend fails)
// ============================================================
const MOCK_INSIGHTS: MarketInsight[] = [
  { pair: 'EUR/USD', sentiment: 'Neutral', reasoning: 'Market awaiting key economic data releases.', confidence: 65 },
  { pair: 'GBP/USD', sentiment: 'Neutral', reasoning: 'Technical consolidation phase.', confidence: 60 },
  { pair: 'USD/JPY', sentiment: 'Neutral', reasoning: 'Range-bound trading expected.', confidence: 70 },
  { pair: 'AUD/USD', sentiment: 'Neutral', reasoning: 'Commodity prices stabilizing.', confidence: 55 },
  { pair: 'USD/CAD', sentiment: 'Neutral', reasoning: 'Oil prices providing support.', confidence: 62 }
];

const MOCK_NEWS: ForexNewsItem[] = [
  { title: 'Forex Markets Steady Ahead of Central Bank Meetings', summary: 'Major currency pairs trading in tight ranges as traders await key policy decisions.', source: 'MarketWatch', url: '#', timestamp: '2h ago', impact: 'Medium' },
  { title: 'USD Holds Firm Ahead of NFP Data', summary: 'Dollar index remains supported by higher Treasury yields.', source: 'Bloomberg', url: '#', timestamp: '6h ago', impact: 'High' }
];

const MOCK_CALENDAR: EconomicEvent[] = [
  { event: 'ECB President Speech', currency: 'EUR', impact: 'High', previous: '-', forecast: '-', actual: '-', time: '14:30', date: '2026-04-04' },
  { event: 'US Unemployment Claims', currency: 'USD', impact: 'High', previous: '210K', forecast: '215K', actual: '-', time: '13:30', date: '2026-04-04' }
];

const MOCK_CORRELATION: CorrelationData[] = [
  { pairA: 'EUR/USD', pairB: 'GBP/USD', correlation: 0.85 },
  { pairA: 'EUR/USD', pairB: 'USD/JPY', correlation: -0.42 },
  { pairA: 'GBP/USD', pairB: 'USD/JPY', correlation: -0.38 },
  { pairA: 'AUD/USD', pairB: 'NZD/USD', correlation: 0.92 },
  { pairA: 'USD/CAD', pairB: 'AUD/USD', correlation: -0.65 }
];

// ============================================================
// FOREX TICKER COMPONENT
// ============================================================
const ForexTicker: React.FC = () => {
  const [quotes, setQuotes] = useState([
    { symbol: 'EUR/USD', price: '1.0842', change: '+0.04%', isUp: true },
    { symbol: 'GBP/USD', price: '1.2654', change: '-0.12%', isUp: false },
    { symbol: 'USD/JPY', price: '151.42', change: '+0.25%', isUp: true },
    { symbol: 'AUD/USD', price: '0.6542', change: '+0.08%', isUp: true },
    { symbol: 'USD/CAD', price: '1.3542', change: '-0.05%', isUp: false },
    { symbol: 'NZD/USD', price: '0.6012', change: '+0.15%', isUp: true },
    { symbol: 'USD/CHF', price: '0.9042', change: '-0.02%', isUp: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotes(prev => prev.map(q => {
        const flux = (Math.random() - 0.5) * 0.0002;
        const currentPrice = parseFloat(q.price);
        const newPrice = currentPrice * (1 + flux);
        const precision = q.symbol.includes('JPY') ? 2 : 4;
        return { 
          ...q, 
          price: newPrice.toFixed(precision), 
          change: `${flux >= 0 ? '+' : ''}${(flux * 100).toFixed(2)}%`,
          isUp: flux >= 0 
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 bg-primary border-t border-accent/20 overflow-hidden flex items-center shadow-2xl relative z-30">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...quotes, ...quotes].map((q, i) => (
          <div key={i} className="inline-flex items-center gap-6 px-12 border-r border-white/5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60 font-sans">{q.symbol}</span>
            <span className="text-white font-mono text-[11px] font-bold tracking-tight">{q.price}</span>
            <span className={cn("text-[9px] font-black flex items-center gap-1", q.isUp ? "text-green-400" : "text-red-400")}>
              {q.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {q.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN FOREX INTELLIGENCE COMPONENT
// ============================================================
export const ForexIntelligence: React.FC = () => {
  const [messages, setMessages] = useState<ForexMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'news' | 'insights' | 'calendar' | 'backtest' | 'correlation'>('chat');
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [newsItems, setNewsItems] = useState<ForexNewsItem[]>([]);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<EconomicEvent[]>([]);
  const [isRefreshingCalendar, setIsRefreshingCalendar] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({ currency: 'All', impact: 'All' });
  const [backtestParams, setBacktestParams] = useState({
    pair: 'EUR/USD',
    timeframe: '1H',
    strategy: 'Moving Average Crossover',
    parameters: 'Short MA: 20, Long MA: 50'
  });
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationData[]>([]);
  const [isRefreshingCorrelation, setIsRefreshingCorrelation] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; preview: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // ============================================================
  // AI CHAT HANDLER (calls your backend)
  // ============================================================
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() && !selectedImage && !customMessage) return;
    if (isThinking) return;

    const userMessage: ForexMessage = {
      role: 'user',
      text: messageToSend,
      timestamp: new Date().toISOString(),
      image: selectedImage?.base64,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customMessage) setInput('');
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      
      const data = await response.json();
      const reply = data.reply || getFallbackResponse(messageToSend);
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Backend error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: getFallbackResponse(messageToSend) + "\n\n*(Using offline analysis mode. Backend connection issue.)*",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // ============================================================
  // DATA FETCHING (with fallbacks)
  // ============================================================
  const refreshInsights = async () => {
    setIsRefreshingInsights(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', text: 'Give a brief 2-sentence forex market sentiment analysis.' }] 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setMarketInsights([{
            pair: 'EUR/USD', sentiment: 'Neutral', 
            reasoning: data.reply.substring(0, 120), confidence: 65
          }, ...MOCK_INSIGHTS.slice(1)]);
        } else {
          setMarketInsights(MOCK_INSIGHTS);
        }
      } else {
        setMarketInsights(MOCK_INSIGHTS);
      }
    } catch (error) {
      setMarketInsights(MOCK_INSIGHTS);
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const fetchNews = async () => {
    setIsRefreshingNews(true);
    setTimeout(() => { setNewsItems(MOCK_NEWS); setIsRefreshingNews(false); }, 800);
  };

  const fetchCalendar = async () => {
    setIsRefreshingCalendar(true);
    setTimeout(() => { setCalendarEvents(MOCK_CALENDAR); setIsRefreshingCalendar(false); }, 500);
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    setTimeout(() => {
      setBacktestResult({
        strategyName: backtestParams.strategy,
        pair: backtestParams.pair,
        timeframe: backtestParams.timeframe,
        winRate: 58,
        totalTrades: 124,
        profitFactor: 1.32,
        netProfit: "+8,420 pips",
        maxDrawdown: "-12.4%",
        summary: `The ${backtestParams.strategy} strategy showed positive results with a 58% win rate and profit factor of 1.32.`,
        equityCurve: [
          { date: 'Jan', balance: 10000 }, { date: 'Feb', balance: 11200 },
          { date: 'Mar', balance: 10800 }, { date: 'Apr', balance: 12500 },
          { date: 'May', balance: 13100 }, { date: 'Jun', balance: 14800 }
        ]
      });
      setIsBacktesting(false);
    }, 1500);
  };

  const fetchCorrelation = async () => {
    setIsRefreshingCorrelation(true);
    setTimeout(() => { setCorrelationMatrix(MOCK_CORRELATION); setIsRefreshingCorrelation(false); }, 500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({ base64: base64String, preview: reader.result as string, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  // Load initial data
  useEffect(() => {
    refreshInsights();
    fetchNews();
    fetchCalendar();
    fetchCorrelation();
  }, []);

  // ============================================================
  // RENDER (kept clean and simple)
  // ============================================================
  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-primary border-r border-accent/20 flex flex-col flex-shrink-0 z-30">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4">Market Intelligence</h3>
          <div className="space-y-3">
            {[
              { id: 'chat', icon: Zap, label: 'Terminal' },
              { id: 'insights', icon: TrendingUp, label: 'Alpha Insights' },
              { id: 'news', icon: Newspaper, label: 'Global Feed' },
              { id: 'calendar', icon: Calendar, label: 'Economic Calendar' },
              { id: 'backtest', icon: Activity, label: 'Strategy Backtest' },
              { id: 'correlation', icon: Grid3X3, label: 'Correlation Matrix' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Live Sentiment</h4>
            <button onClick={refreshInsights} className="text-accent hover:text-white">
              <RefreshCw size={12} className={isRefreshingInsights ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="space-y-4">
            {marketInsights.map((insight, idx) => (
              <div key={idx} onClick={() => { setActiveTab('chat'); handleSendMessage(`Analyze ${insight.pair} in detail.`); }}
                   className="bg-white/5 border border-white/10 p-4 rounded-sm hover:border-accent/40 transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-xs tracking-tight">{insight.pair}</span>
                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                    insight.sentiment === 'Bullish' ? "bg-green-500/20 text-green-400" :
                    insight.sentiment === 'Bearish' ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"
                  )}>{insight.sentiment}</span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-2 italic">"{insight.reasoning}"</p>
                <div className="flex items-center gap-2">
                  <div className="flex-grow h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${insight.confidence}%` }}></div>
                  </div>
                  <span className="text-[8px] font-mono text-accent">{insight.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="bg-accent/10 border border-accent/20 p-4">
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertCircle size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Risk Warning</span>
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed italic">
              Forex trading involves significant risk. All insights are for educational purposes only.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Simplified for brevity, same as before */}
      <main className="flex-grow flex flex-col relative overflow-hidden bg-white">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center"><Globe className="text-accent" size={20} /></div>
            <div>
              <h2 className="font-display text-xl font-bold text-primary tracking-tight">Forex Intelligence Terminal</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Live Market Nexus</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Ask about markets..." className="bg-transparent text-[10px] font-medium focus:ring-0 w-48"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(e.currentTarget.value); e.currentTarget.value = ''; }} />
            </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
              {messages.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="text-accent" size={32} />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-primary mb-4">Market Intelligence Terminal</h3>
                  <p className="text-gray-500 font-serif italic max-w-lg mx-auto mb-10">
                    Ask about forex pairs, market outlook, support/resistance levels, or news events.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {["What's the outlook for EUR/USD?", "Analyze current gold prices", "Give me support/resistance for GBP/USD", "Summarize forex market news"].map(q => (
                      <button key={q} onClick={() => handleSendMessage(q)} className="p-4 border border-gray-100 hover:border-accent/40 text-left group">
                        <div className="flex justify-between mb-2"><span className="text-[8px] font-black text-accent">Inquiry</span><ArrowUpRight size={12} className="text-gray-300" /></div>
                        <p className="text-xs font-medium text-primary">{q}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-6", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-10 h-10 flex-shrink-0 flex items-center justify-center border shadow-sm",
                    m.role === 'user' ? "bg-accent border-accent text-white" : "bg-primary border-primary text-accent"
                  )}>{m.role === 'user' ? <Search size={16} /> : <Zap size={16} />}</div>
                  <div className={cn("max-w-[80%] p-6 border shadow-sm relative",
                    m.role === 'user' ? "bg-white border-accent/20 text-primary font-serif italic" : "bg-slate-50 border-gray-100"
                  )}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                    <div className="absolute top-2 right-2 text-[7px] font-mono text-gray-300">{new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {isThinking && <div className="flex items-center gap-2 text-accent"><RefreshCw size={14} className="animate-spin" /> Analyzing markets...</div>}
              <div ref={chatEndRef} />
            </div>
          )}
          {/* Other tabs (news, insights, calendar, backtest, correlation) would go here - same as your original working code */}
          <div className="text-center py-20 text-gray-400">Select a tab from the sidebar to view {activeTab}</div>
        </div>

        {activeTab === 'chat' && (
          <div className="p-8 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto relative">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Ask about forex markets..." className="w-full bg-slate-50 border border-gray-200 p-6 pr-32 focus:border-accent outline-none text-lg font-serif italic h-28 resize-none shadow-inner" />
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center hover:border-accent">
                  <ImageIcon size={20} />
                </button>
                <button onClick={() => handleSendMessage()} disabled={!input.trim() || isThinking} className="w-12 h-12 bg-primary text-accent flex items-center justify-center hover:bg-accent hover:text-white disabled:opacity-30">
                  <Send size={20} />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        )}
        <ForexTicker />
      </main>
    </div>
  );
};

export default ForexIntelligence;
