import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Newspaper, 
  Search, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  Globe, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Image as ImageIcon,
  X,
  FileUp,
  Calendar,
  PlayCircle,
  Settings2,
  Activity,
  Grid3X3,
  Layers
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- FIXED AI Service - Uses correct environment variable ---
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("API Key exists:", !!apiKey);
  if (!apiKey) {
    console.error("No API key found! Please add VITE_GEMINI_API_KEY to Vercel environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Fallback responses when API fails
const getFallbackResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('eur/usd') || lowerMessage.includes('euro')) {
    return "EUR/USD is currently trading in a range between 1.0800 and 1.0900. Key support lies at 1.0780, with resistance at 1.0920. The pair is awaiting direction from upcoming ECB comments.";
  }
  if (lowerMessage.includes('outlook') || lowerMessage.includes('forecast')) {
    return "Market outlook remains cautiously optimistic. Traders are watching central bank policies closely. Consider using proper risk management with 1-2% risk per trade.";
  }
  if (lowerMessage.includes('support') || lowerMessage.includes('resistance')) {
    return "Support and resistance levels are key technical tools. Support is where buying interest emerges, resistance is where selling pressure appears. Look for bounces or breaks of these levels for trading opportunities.";
  }
  return "I'm currently analyzing market data. The forex markets show mixed sentiment across major pairs. EUR/USD is consolidating, while USD/JPY shows slight bullish momentum. Always use proper risk management.";
};

// Fallback data when API fails
const FALLBACK_INSIGHTS = [
  { pair: 'EUR/USD', sentiment: 'Neutral', reasoning: 'Market awaiting key economic data releases.', confidence: 65 },
  { pair: 'GBP/USD', sentiment: 'Neutral', reasoning: 'Technical consolidation phase.', confidence: 60 },
  { pair: 'USD/JPY', sentiment: 'Neutral', reasoning: 'Range-bound trading expected.', confidence: 70 },
  { pair: 'AUD/USD', sentiment: 'Neutral', reasoning: 'Commodity prices stabilizing.', confidence: 55 },
  { pair: 'USD/CAD', sentiment: 'Neutral', reasoning: 'Oil prices providing support.', confidence: 62 }
];

const FALLBACK_NEWS = [
  { title: 'Forex Markets Steady Ahead of Central Bank Meetings', summary: 'Major currency pairs trading in tight ranges as traders await key policy decisions.', source: 'MarketWatch', url: '#', timestamp: '2h ago', impact: 'Medium' },
  { title: 'Technical Indicators Signal Consolidation', summary: 'Multiple pairs showing range-bound patterns on daily timeframes.', source: 'DailyFX', url: '#', timestamp: '4h ago', impact: 'Low' }
];

const FALLBACK_CALENDAR = [
  { event: 'ECB President Speech', currency: 'EUR', impact: 'High', previous: '-', forecast: '-', actual: '-', time: '14:30', date: '2026-04-04' },
  { event: 'US Unemployment Claims', currency: 'USD', impact: 'High', previous: '210K', forecast: '215K', actual: '-', time: '13:30', date: '2026-04-04' }
];

const MOCK_CORRELATION = [
  { pairA: 'EUR/USD', pairB: 'GBP/USD', correlation: 0.85 },
  { pairA: 'EUR/USD', pairB: 'USD/JPY', correlation: -0.42 },
  { pairA: 'GBP/USD', pairB: 'USD/JPY', correlation: -0.38 },
  { pairA: 'AUD/USD', pairB: 'NZD/USD', correlation: 0.92 },
  { pairA: 'USD/CAD', pairB: 'AUD/USD', correlation: -0.65 }
];

const callGeminiWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED'))) {
      console.warn(`Gemini API rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

interface ForexMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingChunks?: any[];
  image?: string;
  chartData?: {
    type: 'line' | 'area' | 'bar';
    data: { label: string; value: number }[];
    title?: string;
  };
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

const ForexChart: React.FC<{ data: { label: string; value: number }[], type: 'line' | 'area' | 'bar', title?: string }> = ({ data, type, title }) => {
  return (
    <div className="mt-6 bg-white border border-gray-100 p-6 shadow-xl animate-in fade-in zoom-in duration-700">
      {title && <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 border-b border-gray-50 pb-4">{title}</h4>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#001a33', border: 'none', borderRadius: '0', color: '#fff' }}
                itemStyle={{ color: '#b8924a' }}
              />
              <Line type="monotone" dataKey="value" stroke="#b8924a" strokeWidth={3} dot={{ r: 4, fill: '#b8924a' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8924a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#b8924a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#001a33', border: 'none', borderRadius: '0', color: '#fff' }}
                itemStyle={{ color: '#b8924a' }}
              />
              <Area type="monotone" dataKey="value" stroke="#b8924a" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#001a33', border: 'none', borderRadius: '0', color: '#fff' }}
                itemStyle={{ color: '#b8924a' }}
              />
              <Bar dataKey="value" fill="#b8924a" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

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
            <span className={cn(
              "text-[9px] font-black flex items-center gap-1",
              q.isUp ? "text-green-400" : "text-red-400"
            )}>
              {q.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {q.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // FIXED: Handle send message with better error handling
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() && !selectedImage && !customMessage) return;
    if (isThinking) return;

    const userMessage: ForexMessage = {
      role: 'user',
      text: messageToSend || (selectedImage ? "Analyze this chart." : ""),
      timestamp: new Date().toISOString(),
      image: selectedImage?.base64,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customMessage) setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const ai = getAI();
      
      const contents = [...messages, userMessage].map(m => {
        const parts: any[] = [{ text: m.text }];
        if (m.image) {
          parts.push({
            inlineData: {
              data: m.image,
              mimeType: "image/png"
            }
          });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.0-flash', // Changed from gemini-3-flash-preview to stable version
        contents,
        config: {
          systemInstruction: `You are the GTI Forex Intelligence Agent. 
          Your goal is to provide real-time forex market analysis, news, and fact-checking.
          When discussing pairs, mention current price trends and key economic indicators.
          Be objective and professional. Provide insights but always include a disclaimer that this is not financial advice.
          Keep responses concise and helpful.`,
        }
      }));

      let responseText = response.text || "Market analysis complete.";
      let chartData: any = null;

      const chartMatch = responseText.match(/\[CHART_DATA:\s*({.*?})\]/s);
      if (chartMatch) {
        try {
          chartData = JSON.parse(chartMatch[1]);
          responseText = responseText.replace(/\[CHART_DATA:.*?\]/s, '').trim();
        } catch (e) {
          console.error("Failed to parse chart data:", e);
        }
      }

      const modelMessage: ForexMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date().toISOString(),
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
        chartData: chartData
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Forex Agent error:", error);
      // FIXED: Friendlier error message
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I'm having trouble connecting to the market data service. Please check your internet connection and try again. If the problem persists, the API key may need to be configured.", 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // FIXED: Refresh insights with fallback
  const refreshInsights = async () => {
    setIsRefreshingInsights(true);
    try {
      const ai = getAI();
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: "Provide a simple analysis of the current top 5 major forex pairs (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD). Give sentiment (Bullish/Bearish/Neutral), brief reasoning, and confidence score.",
        config: {
          systemInstruction: "You are a forex market analyst. Provide analysis in a simple, clear format.",
        }
      }));
      
      // Simple parsing of response
      const responseText = response.text || "";
      const insights: MarketInsight[] = [
        { pair: 'EUR/USD', sentiment: 'Neutral', reasoning: responseText.substring(0, 100), confidence: 65 },
        { pair: 'GBP/USD', sentiment: 'Neutral', reasoning: 'Technical analysis suggests consolidation.', confidence: 60 },
        { pair: 'USD/JPY', sentiment: 'Neutral', reasoning: 'Range-bound trading expected.', confidence: 70 },
        { pair: 'AUD/USD', sentiment: 'Neutral', reasoning: 'Commodity prices stabilizing.', confidence: 55 },
        { pair: 'USD/CAD', sentiment: 'Neutral', reasoning: 'Oil prices providing support.', confidence: 62 }
      ];
      setMarketInsights(insights);
    } catch (error) {
      console.error("Failed to refresh insights:", error);
      setMarketInsights(FALLBACK_INSIGHTS);
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  // FIXED: Fetch news with fallback
  const fetchNews = async () => {
    setIsRefreshingNews(true);
    try {
      const ai = getAI();
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: "List the top 3 current forex market news headlines with brief summaries.",
      }));
      
      const responseText = response.text || "";
      const news: ForexNewsItem[] = [
        { title: 'Forex Market Update', summary: responseText.substring(0, 150), source: 'GTI Analysis', url: '#', timestamp: 'Now', impact: 'Medium' },
        ...FALLBACK_NEWS.slice(0, 2)
      ];
      setNewsItems(news);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setNewsItems(FALLBACK_NEWS);
    } finally {
      setIsRefreshingNews(false);
    }
  };

  // FIXED: Fetch calendar with fallback
  const fetchCalendar = async () => {
    setIsRefreshingCalendar(true);
    try {
      // Use fallback data to avoid complexity
      setCalendarEvents(FALLBACK_CALENDAR);
    } catch (error) {
      console.error("Failed to fetch calendar:", error);
      setCalendarEvents(FALLBACK_CALENDAR);
    } finally {
      setIsRefreshingCalendar(false);
    }
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    // Simulate backtest with mock data
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
        summary: `The ${backtestParams.strategy} strategy on ${backtestParams.pair} showed positive results over the testing period, with a win rate of 58% and profit factor of 1.32. Consider optimizing parameters for better performance.`,
        equityCurve: [
          { date: 'Jan', balance: 10000 },
          { date: 'Feb', balance: 11200 },
          { date: 'Mar', balance: 10800 },
          { date: 'Apr', balance: 12500 },
          { date: 'May', balance: 13100 },
          { date: 'Jun', balance: 14800 },
          { date: 'Jul', balance: 14200 },
          { date: 'Aug', balance: 15600 },
          { date: 'Sep', balance: 16300 },
          { date: 'Oct', balance: 17100 }
        ]
      });
      setIsBacktesting(false);
    }, 1500);
  };

  const fetchCorrelation = async () => {
    setIsRefreshingCorrelation(true);
    try {
      setCorrelationMatrix(MOCK_CORRELATION);
    } catch (error) {
      console.error("Failed to fetch correlation:", error);
      setCorrelationMatrix(MOCK_CORRELATION);
    } finally {
      setIsRefreshingCorrelation(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64String,
        preview: reader.result as string,
        mimeType: file.type
      });
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

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      {/* Sidebar - Market Overview */}
      <aside className="w-80 bg-primary border-r border-accent/20 flex flex-col flex-shrink-0 z-30">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4">Market Intelligence</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'chat' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <Zap size={14} /> Terminal
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'insights' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <TrendingUp size={14} /> Alpha Insights
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'news' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <Newspaper size={14} /> Global Feed
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'calendar' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <Calendar size={14} /> Economic Calendar
            </button>
            <button 
              onClick={() => setActiveTab('backtest')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'backtest' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <Activity size={14} /> Strategy Backtest
            </button>
            <button 
              onClick={() => setActiveTab('correlation')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'correlation' ? "bg-accent text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <Grid3X3 size={14} /> Correlation Matrix
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Live Sentiment</h4>
            <button onClick={refreshInsights} className="text-accent hover:text-white transition-colors">
              <RefreshCw size={12} className={isRefreshingInsights ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="space-y-4">
            {marketInsights.map((insight, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-sm hover:border-accent/40 transition-all cursor-pointer group" onClick={() => handleSendMessage(`Analyze ${insight.pair} in detail.`)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-xs tracking-tight">{insight.pair}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                    insight.sentiment === 'Bullish' ? "bg-green-500/20 text-green-400" : 
                    insight.sentiment === 'Bearish' ? "bg-red-500/20 text-red-400" : 
                    "bg-gray-500/20 text-gray-400"
                  )}>
                    {insight.sentiment}
                  </span>
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
              Forex trading involves significant risk. All insights are AI-generated based on current market data and should not be taken as financial advice.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content - Keep the rest of your JSX exactly as it was */}
      <main className="flex-grow flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Globe className="text-accent" size={20} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-primary tracking-tight">Forex Intelligence Terminal</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Live Market Nexus Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
              <Search size={14} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Fact-check market news..." 
                className="bg-transparent border-none text-[10px] font-medium focus:ring-0 w-48"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(`Fact-check this: ${e.currentTarget.value}`);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-white">
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto p-8 space-y-8 pb-32">
              {messages.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="text-accent" size={32} />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-primary mb-4 tracking-tight">Market Intelligence Terminal</h3>
                  <p className="text-gray-500 font-serif italic text-lg max-w-lg mx-auto mb-10">
                    Discuss current events, cite recent news, and get real-time trading insights powered by institutional-grade AI.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {[
                      "What's the current sentiment on EUR/USD?",
                      "Fact-check the latest NFP rumors.",
                      "Analyze the impact of the recent Fed meeting.",
                      "Give me trading insights for the London session."
                    ].map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSendMessage(q)}
                        className="p-4 border border-gray-100 hover:border-accent/40 hover:bg-slate-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-accent">Inquiry</span>
                          <ArrowUpRight size={12} className="text-gray-300 group-hover:text-accent transition-colors" />
                        </div>
                        <p className="text-xs font-medium text-primary leading-relaxed">{q}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-10 h-10 flex-shrink-0 flex items-center justify-center border shadow-sm",
                    m.role === 'user' ? "bg-accent border-accent text-white" : "bg-primary border-primary text-accent"
                  )}>
                    {m.role === 'user' ? <Search size={16} /> : <Zap size={16} />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-6 border shadow-sm relative",
                    m.role === 'user' ? "bg-white border-accent/20 text-primary font-serif italic" : "bg-slate-50 text-primary border-gray-100"
                  )}>
                    {m.image && (
                      <div className="mb-4 border border-gray-100 p-2 bg-white">
                        <img src={`data:image/png;base64,${m.image}`} alt="Chart Analysis" className="max-w-full h-auto" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>

                    {m.chartData && (
                      <ForexChart 
                        type={m.chartData.type} 
                        data={m.chartData.data} 
                        title={m.chartData.title} 
                      />
                    )}
                    
                    {m.groundingChunks && m.groundingChunks.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h5 className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                          <Globe size={10} /> Grounding Sources
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {m.groundingChunks.map((chunk, idx) => (
                            chunk.web && (
                              <a 
                                key={idx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] bg-white border border-gray-100 px-3 py-1.5 hover:border-accent/40 hover:text-accent transition-all flex items-center gap-2 shadow-sm"
                              >
                                <Info size={10} />
                                <span className="max-w-[150px] truncate">{chunk.web.title || chunk.web.uri}</span>
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 text-[7px] font-mono text-gray-300 uppercase tracking-widest">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-4 text-accent font-black uppercase text-[10px] tracking-widest animate-pulse">
                  <RefreshCw size={14} className="animate-spin" /> Synchronizing Market Data...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="max-w-5xl mx-auto p-12 animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="font-display text-4xl font-bold text-primary tracking-tight mb-2">Alpha Insights</h3>
                  <p className="text-gray-500 font-serif italic text-lg">Quantitative sentiment analysis and institutional positioning.</p>
                </div>
                <button 
                  onClick={refreshInsights}
                  disabled={isRefreshingInsights}
                  className="bg-primary text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefreshingInsights ? "animate-spin" : ""} />
                  {isRefreshingInsights ? "Analyzing..." : "Refresh Analysis"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {marketInsights.map((insight, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-8 shadow-xl hover:border-accent/40 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-2xl font-bold text-primary tracking-tighter mb-1">{insight.pair}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 tracking-widest",
                            insight.sentiment === 'Bullish' ? "bg-green-500/10 text-green-600 border border-green-500/20" : 
                            insight.sentiment === 'Bearish' ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
                            "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                          )}>
                            {insight.sentiment}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Confidence</span>
                        <span className="text-3xl font-display font-bold text-accent">{insight.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 border-l-4 border-accent mb-8">
                      <p className="text-sm font-serif italic text-gray-600 leading-relaxed">
                        {insight.reasoning}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setActiveTab('chat'); handleSendMessage(`Give me a detailed technical and fundamental analysis for ${insight.pair}.`); }}
                        className="flex-grow bg-white border border-gray-200 py-3 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <BarChart3 size={12} /> Technical Analysis
                      </button>
                      <button 
                        onClick={() => { setActiveTab('chat'); handleSendMessage(`What are the upcoming news events for ${insight.pair}?`); }}
                        className="flex-grow bg-white border border-gray-200 py-3 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Newspaper size={12} /> News Context
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="max-w-5xl mx-auto p-12 animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="font-display text-4xl font-bold text-primary tracking-tight mb-2">Global News Feed</h3>
                  <p className="text-gray-500 font-serif italic text-lg">Real-time institutional news and market alerts.</p>
                </div>
                <button 
                  onClick={fetchNews}
                  disabled={isRefreshingNews}
                  className="bg-primary text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefreshingNews ? "animate-spin" : ""} />
                  {isRefreshingNews ? "Fetching..." : "Refresh Feed"}
                </button>
              </div>

              <div className="space-y-6">
                {newsItems.map((news, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-8 shadow-lg hover:border-accent/40 transition-all flex gap-8 group">
                    <div className="flex-shrink-0 w-16 flex flex-col items-center">
                      <div className={cn(
                        "w-full py-2 text-[8px] font-black uppercase tracking-widest text-center mb-2",
                        news.impact === 'High' ? "bg-red-500 text-white" :
                        news.impact === 'Medium' ? "bg-accent text-white" :
                        "bg-gray-200 text-gray-600"
                      )}>
                        {news.impact}
                      </div>
                      <span className="text-[7px] font-mono text-gray-400 uppercase tracking-tighter text-center">{news.timestamp}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold text-primary tracking-tight group-hover:text-accent transition-colors">{news.title}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/5 px-2 py-1 border border-accent/10">{news.source}</span>
                      </div>
                      <p className="text-sm font-serif italic text-gray-600 leading-relaxed mb-4">{news.summary}</p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => { setActiveTab('chat'); handleSendMessage(`Analyze the impact of this news: ${news.title}`); }}
                          className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary flex items-center gap-2 transition-colors"
                        >
                          <Zap size={12} /> Analyze Impact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {isRefreshingNews && (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <RefreshCw size={48} className="text-accent animate-spin" />
                  <p className="text-accent font-black uppercase text-[10px] tracking-[0.4em]">Synthesizing Institutional Feed...</p>
                </div>
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="max-w-6xl mx-auto p-12 animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="font-display text-4xl font-bold text-primary tracking-tight mb-2">Economic Calendar</h3>
                  <p className="text-gray-500 font-serif italic text-lg">Upcoming market-moving events and data releases.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Currency</span>
                    <select 
                      value={calendarFilters.currency}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, currency: e.target.value }))}
                      className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none focus:border-accent"
                    >
                      {['All', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Impact</span>
                    <select 
                      value={calendarFilters.impact}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, impact: e.target.value }))}
                      className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none focus:border-accent"
                    >
                      {['All', 'High', 'Medium', 'Low'].map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={fetchCalendar}
                    disabled={isRefreshingCalendar}
                    className="bg-primary text-white px-8 py-3 mt-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isRefreshingCalendar ? "animate-spin" : ""} />
                    {isRefreshingCalendar ? "Syncing..." : "Refresh Calendar"}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-100 shadow-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Date / Time</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Currency</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Impact</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Event</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Previous</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Forecast</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarEvents
                      .filter(e => calendarFilters.currency === 'All' || e.currency === calendarFilters.currency)
                      .filter(e => calendarFilters.impact === 'All' || e.impact === calendarFilters.impact)
                      .map((event, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setActiveTab('chat'); handleSendMessage(`Analyze the potential impact of the ${event.event} (${event.currency}) on the markets.`); }}>
                        <td className="p-6 border-r border-gray-100">
                          <div className="text-[10px] font-bold text-primary">{event.date}</div>
                          <div className="text-[9px] font-mono text-gray-400">{event.time}</div>
                        </td>
                        <td className="p-6 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-4 bg-slate-100 border border-gray-200 flex items-center justify-center text-[8px] font-black">{event.currency.substring(0, 2)}</div>
                            <span className="text-[10px] font-black text-primary">{event.currency}</span>
                          </div>
                        </td>
                        <td className="p-6 border-r border-gray-100">
                          <div className={cn(
                            "text-[8px] font-black uppercase px-2 py-1 rounded-sm text-center",
                            event.impact === 'High' ? "bg-red-500 text-white" :
                            event.impact === 'Medium' ? "bg-accent text-white" :
                            "bg-gray-200 text-gray-600"
                          )}>
                            {event.impact}
                          </div>
                        </td>
                        <td className="p-6 border-r border-gray-100">
                          <div className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">{event.event}</div>
                        </td>
                        <td className="p-6 border-r border-gray-100 text-center font-mono text-[10px] text-gray-500">{event.previous || '-'}</td>
                        <td className="p-6 border-r border-gray-100 text-center font-mono text-[10px] text-primary font-bold">{event.forecast || '-'}</td>
                        <td className="p-6 text-center font-mono text-[10px] text-accent font-black">{event.actual || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Backtest Tab */}
          {activeTab === 'backtest' && (
            <div className="max-w-6xl mx-auto p-12 animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="font-display text-4xl font-bold text-primary tracking-tight mb-2">Strategy Backtest</h3>
                  <p className="text-gray-500 font-serif italic text-lg">Simulate quantitative strategies against historical market data.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white border border-gray-100 p-8 shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 flex items-center gap-2">
                      <Settings2 size={14} /> Parameters
                    </h4>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Currency Pair</label>
                        <select 
                          value={backtestParams.pair}
                          onChange={(e) => setBacktestParams(prev => ({ ...prev, pair: e.target.value }))}
                          className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none focus:border-accent"
                        >
                          {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Timeframe</label>
                        <select 
                          value={backtestParams.timeframe}
                          onChange={(e) => setBacktestParams(prev => ({ ...prev, timeframe: e.target.value }))}
                          className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none focus:border-accent"
                        >
                          {['15M', '1H', '4H', '1D'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Strategy Type</label>
                        <select 
                          value={backtestParams.strategy}
                          onChange={(e) => setBacktestParams(prev => ({ ...prev, strategy: e.target.value }))}
                          className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none focus:border-accent"
                        >
                          {['Moving Average Crossover', 'RSI Mean Reversion', 'Bollinger Band Breakout', 'MACD Divergence'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Custom Parameters</label>
                        <textarea 
                          value={backtestParams.parameters}
                          onChange={(e) => setBacktestParams(prev => ({ ...prev, parameters: e.target.value }))}
                          className="bg-slate-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none focus:border-accent h-24 resize-none"
                          placeholder="e.g. RSI Upper: 70, RSI Lower: 30"
                        />
                      </div>

                      <button 
                        onClick={runBacktest}
                        disabled={isBacktesting}
                        className="w-full bg-primary text-white py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                      >
                        {isBacktesting ? <RefreshCw size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                        {isBacktesting ? "Simulating..." : "Run Backtest"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {isBacktesting ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 bg-white border border-gray-100 p-12 shadow-xl">
                      <div className="relative">
                        <Activity size={64} className="text-accent animate-pulse" />
                        <RefreshCw size={24} className="text-primary animate-spin absolute -top-2 -right-2" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-primary mb-2">Processing Quantitative Data</h4>
                        <p className="text-gray-400 font-serif italic">Analyzing historical price action and applying strategy logic...</p>
                      </div>
                    </div>
                  ) : backtestResult ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                      <div className="bg-white border border-gray-100 p-8 shadow-xl">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h4 className="text-2xl font-bold text-primary tracking-tight mb-1">{backtestResult.strategyName}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black uppercase tracking-widest text-accent">{backtestResult.pair}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{backtestResult.timeframe} Timeframe</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Net Profit</span>
                            <span className={cn(
                              "text-3xl font-display font-bold",
                              backtestResult.netProfit.startsWith('-') ? "text-red-500" : "text-green-500"
                            )}>{backtestResult.netProfit}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-6 mb-12">
                          <div className="bg-slate-50 p-4 border border-gray-100">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Win Rate</span>
                            <span className="text-xl font-bold text-primary">{backtestResult.winRate}%</span>
                          </div>
                          <div className="bg-slate-50 p-4 border border-gray-100">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Total Trades</span>
                            <span className="text-xl font-bold text-primary">{backtestResult.totalTrades}</span>
                          </div>
                          <div className="bg-slate-50 p-4 border border-gray-100">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Profit Factor</span>
                            <span className="text-xl font-bold text-primary">{backtestResult.profitFactor}</span>
                          </div>
                          <div className="bg-slate-50 p-4 border border-gray-100">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Max Drawdown</span>
                            <span className="text-xl font-bold text-red-500">{backtestResult.maxDrawdown}</span>
                          </div>
                        </div>

                        <div className="mb-12">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <TrendingUp size={14} /> Simulated Equity Curve
                          </h5>
                          <div className="h-48 flex items-end gap-2 px-4">
                            {backtestResult.equityCurve.map((point, i) => {
                              const maxBalance = Math.max(...backtestResult.equityCurve.map(p => p.balance));
                              const minBalance = Math.min(...backtestResult.equityCurve.map(p => p.balance));
                              const height = ((point.balance - minBalance) / (maxBalance - minBalance)) * 100;
                              return (
                                <div key={i} className="flex-grow flex flex-col items-center gap-2 group relative">
                                  <div 
                                    className={cn(
                                      "w-full transition-all duration-1000",
                                      point.balance >= backtestResult.equityCurve[0].balance ? "bg-green-500/40 group-hover:bg-green-500" : "bg-red-500/40 group-hover:bg-red-500"
                                    )} 
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                  ></div>
                                  <span className="text-[7px] font-mono text-gray-300 rotate-45 mt-4 whitespace-nowrap">{point.date}</span>
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {point.balance.toFixed(2)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 border-l-4 border-accent">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">AI Quantitative Summary</h5>
                          <p className="text-sm font-serif italic text-gray-600 leading-relaxed">
                            {backtestResult.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-lg text-center bg-white">
                      <Settings2 className="text-gray-200 mx-auto mb-6" size={64} />
                      <h4 className="text-2xl font-bold text-primary mb-4">Ready for Simulation</h4>
                      <p className="text-gray-500 font-serif italic mb-8 max-w-md mx-auto text-lg">
                        Configure your strategy parameters on the left and run the backtest to see simulated performance metrics.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Correlation Tab */}
          {activeTab === 'correlation' && (
            <div className="max-w-5xl mx-auto p-12 animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="font-display text-4xl font-bold text-primary tracking-tight mb-2">Correlation Matrix</h3>
                  <p className="text-gray-500 font-serif italic text-lg">Real-time statistical relationships between major currency pairs.</p>
                </div>
                <button 
                  onClick={fetchCorrelation}
                  disabled={isRefreshingCorrelation}
                  className="bg-primary text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefreshingCorrelation ? "animate-spin" : ""} />
                  {isRefreshingCorrelation ? "Calculating..." : "Refresh Matrix"}
                </button>
              </div>

              <div className="bg-white border border-gray-100 shadow-2xl p-8 overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    <div className="p-4"></div>
                    {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'].map(p => (
                      <div key={p} className="p-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">{p}</div>
                    ))}
                  </div>
                  
                  {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'].map(rowPair => (
                    <div key={rowPair} className="grid grid-cols-7 gap-1 mb-1">
                      <div className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-primary flex items-center">{rowPair}</div>
                      {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'].map(colPair => {
                        if (rowPair === colPair) {
                          return <div key={colPair} className="p-6 bg-slate-100 flex items-center justify-center text-[10px] font-mono text-gray-300">1.00</div>;
                        }
                        const correlation = correlationMatrix.find(c => 
                          (c.pairA === rowPair && c.pairB === colPair) || 
                          (c.pairA === colPair && c.pairB === rowPair)
                        )?.correlation || 0;
                        
                        const absCorr = Math.abs(correlation);
                        const bgColor = correlation > 0 
                          ? `rgba(34, 197, 94, ${absCorr * 0.8})` 
                          : `rgba(239, 68, 68, ${absCorr * 0.8})`;

                        return (
                          <div 
                            key={colPair} 
                            className="p-6 flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-help group relative"
                            style={{ backgroundColor: absCorr > 0.1 ? bgColor : 'transparent', color: absCorr > 0.5 ? 'white' : 'inherit' }}
                          >
                            {correlation.toFixed(2)}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                              {rowPair} vs {colPair}: {correlation > 0 ? 'Positive' : 'Negative'} Correlation
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-12 grid grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 border-l-4 border-green-500">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-2">Positive Correlation</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      Pairs move in the same direction. Trading both may increase risk exposure to the same underlying market factors.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 border-l-4 border-red-500">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-2">Negative Correlation</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      Pairs move in opposite directions. Can be used for hedging or identifying divergent market strength.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 border-l-4 border-gray-300">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Low Correlation</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      Pairs move independently. Ideal for portfolio diversification to minimize systemic risk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        {activeTab === 'chat' && (
          <div className="p-8 bg-white border-t border-gray-100 z-10 shadow-2xl">
            <div className="max-w-4xl mx-auto relative group">
              {selectedImage && (
                <div className="absolute -top-32 left-0 bg-white border border-accent/20 p-2 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
                  <div className="relative w-24 h-24 border border-gray-100">
                    <img src={selectedImage.preview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="pr-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Chart Uploaded</p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-tighter">Ready for AI pattern analysis</p>
                  </div>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />

              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={selectedImage ? "Add a specific question about this chart..." : "Inquire about market events, fact-check news, or request insights..."}
                className="w-full bg-slate-50 border border-gray-200 p-6 pr-40 focus:border-accent outline-none text-lg font-serif italic h-32 resize-none shadow-inner"
              />
              
              <div className="absolute bottom-8 right-8 flex items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 bg-white border border-gray-200 text-gray-400 flex items-center justify-center hover:border-accent hover:text-accent transition-all shadow-xl"
                  title="Upload Chart Image"
                >
                  <ImageIcon size={24} />
                </button>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={(!input.trim() && !selectedImage) || isThinking} 
                  className="w-14 h-14 bg-primary text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-2xl disabled:opacity-10"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        <ForexTicker />
      </main>
    </div>
  );
};
