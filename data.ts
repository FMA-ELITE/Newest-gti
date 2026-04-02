
import { AcademicLevel, Course, Faculty, LibraryItem, NewsItem } from './types';

export const COURSES: Course[] = [
  {
    id: 'LIT-101',
    title: 'The Architecture of Wealth: From Zero to Sovereignty',
    level: AcademicLevel.FOUNDATION,
    credits: 3,
    instructor: 'Dr. Julian Thorne',
    department: 'Foundational Literacy',
    description: 'A deconstruction of the global monetary system. Starting from first principles of value, we explore how central banks, inflation, and interest rates shape your economic reality.',
    syllabus: ['First Principles of Value', 'The Central Bank Ledger', 'Inflation & Purchasing Power', 'Wealth Preservation Cycles'],
    learningOutcomes: [
      'Master the distinction between currency and money.',
      'Identify the mechanism of debt-based monetary expansion.',
      'Strategize wealth preservation during high-inflation cycles.',
      'Understand the historical correlation of interest rates and asset bubbles.'
    ],
    readingList: ['The Richest Man in Babylon - George S. Clason', 'The Psychology of Money - Morgan Housel'],
    image: 'https://images.unsplash.com/photo-1611974717482-480f28a7e58a?auto=format&fit=crop&q=80&w=1200',
    visualPrompt: 'Institutional academic visual: A golden architectural blueprint of a high-security bank vault with floating digital nodes and rising market lines, cinematic lighting, navy and gold palette, 8k.'
  },
  {
    id: 'FX-202',
    title: 'Forex Mechanics & Institutional Liquidity',
    level: AcademicLevel.UNDERGRADUATE,
    credits: 4,
    instructor: 'Sarah Chen',
    department: 'Market Operations',
    description: 'Learn the mechanics of the $7 trillion-a-day FX market. We focus on interbank flow, session psychology, and the strategic positioning of large institutions.',
    syllabus: ['The FX Microstructure', 'Market Session Flow', 'Economic Indicators (NFP/CPI)', 'Liquidity Pools & Stop Runs'],
    learningOutcomes: [
      'Navigate the Interbank market architecture.',
      'Execute trades based on London/New York session liquidity transitions.',
      'Analyze Central Bank sentiment through commitment of traders (COT) reports.',
      'Identify institutional "stop runs" and liquidity-grab patterns.'
    ],
    readingList: ['Trading for a Living - Alexander Elder', 'Global Macro Trading - Greg Guszcza'],
    image: 'https://images.unsplash.com/photo-1642390250611-306f0a671801?auto=format&fit=crop&q=80&w=1200',
    visualPrompt: 'High-speed digital currency flow: Glowing symbols of USD, EUR, and GBP streaming through a transparent glass trading terminal, soft bokeh, institutional gold and blue light, ultra-detailed.'
  },
  {
    id: 'CRY-305',
    title: 'Cryptographic Assets & Digital Settlement',
    level: AcademicLevel.GRADUATE,
    credits: 6,
    instructor: 'Marcus Vane',
    department: 'Digital Finance',
    description: 'Moving beyond speculation into the infrastructure of Bitcoin and Ethereum. Analyzing on-chain data, DeFi protocols, and institutional custody solutions.',
    syllabus: ['DLT & Consensus Mechanisms', 'On-Chain Liquidity Analysis', 'DeFi yield Architectures', 'Digital Asset Risk Modeling'],
    learningOutcomes: [
      'Audit smart contract interactions for institutional risk.',
      'Interpret whale movement and accumulation cycles via Etherscan.',
      'Construct delta-neutral yield strategies in DeFi environments.',
      'Evaluate Layer-2 scaling solutions for global settlement efficiency.'
    ],
    readingList: ['The Bitcoin Standard - Saifedean Ammous', 'Mastering Ethereum - Andreas Antonopoulos'],
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200',
    visualPrompt: 'Abstract blockchain architecture: 3D geometric crystals representing data blocks linked by golden energy filaments in a dark obsidian institutional space, prestigious aesthetic.'
  },
  {
    id: 'ALG-900',
    title: 'Algorithmic Alpha & Quantitative Systems',
    level: AcademicLevel.MASTERS,
    credits: 12,
    instructor: 'Dr. Julian Thorne',
    department: 'Advanced Studies',
    description: 'The pinnacle of market execution. Designing high-frequency models, VWAP/TWAP execution strategies, and managing multi-asset institutional portfolios.',
    syllabus: ['Statistical Arbitrage', 'Machine Learning in Markets', 'HFT Execution Engines', 'Systemic Risk management'],
    learningOutcomes: [
      'Build statistical arbitrage models with Python/C++.',
      'Deploy machine learning classifiers for directional alpha identification.',
      'Optimize multi-asset portfolios using modern portfolio theory and Monte Carlo sims.',
      'Manage real-time execution risk via automated VWAP algorithms.'
    ],
    readingList: ['Flash Boys - Michael Lewis', 'Algorithmic Trading - Ernie Chan'],
    image: 'https://images.unsplash.com/photo-1551288049-bbbda5366392?auto=format&fit=crop&q=80&w=1200',
    visualPrompt: 'Quantum trading terminal: Complex mathematical flowcharts projected in a dark, high-tech institutional command center, golden glow, futuristic finance, hyper-realistic.'
  },
  {
    id: 'RSK-505',
    title: 'Systemic Risk & Black Swan Hedging',
    level: AcademicLevel.GRADUATE,
    credits: 8,
    instructor: 'Sarah Chen',
    department: 'Risk Management',
    description: 'Advanced study of tail-risk events. Learn to construct robust portfolios that thrive in chaos using non-linear derivatives and volatility-based hedging strategies.',
    syllabus: ['Tail Risk Mathematics', 'Volatility Surface Analysis', 'Convexity & Gamma Scalping', 'Crisis Correlation Shifts'],
    learningOutcomes: [
      'Quantify systemic risk in multi-asset portfolios.',
      'Construct "anti-fragile" hedging structures.',
      'Master the use of long-volatility instruments during market stress.',
      'Analyze historical black swan events to identify early warning signals.'
    ],
    readingList: ['The Black Swan - Nassim Taleb', 'Dynamic Hedging - Nassim Taleb'],
    image: '',
    visualPrompt: 'Abstract representation of market chaos: A dark, turbulent ocean of digital data with a single golden lighthouse beam cutting through, sharp geometric shards, institutional navy and gold.'
  },
  {
    id: 'PSY-102',
    title: 'The Psychology of the Tape: Emotional Sovereignty',
    level: AcademicLevel.FOUNDATION,
    credits: 2,
    instructor: 'Dr. Julian Thorne',
    department: 'Behavioral Finance',
    description: 'Master the internal game. This course explores the neurobiology of trading, bias mitigation, and the development of the "Institutional Mindset" required for high-stakes execution.',
    syllabus: ['Neurobiology of Risk', 'Cognitive Bias Deconstruction', 'Performance Breathing & Focus', 'The Ego in Market Execution'],
    learningOutcomes: [
      'Identify personal psychological triggers during drawdown.',
      'Implement a systematic bias-mitigation checklist.',
      'Develop a high-performance routine for market sessions.',
      'Understand the biological impact of leverage on decision making.'
    ],
    readingList: ['The Daily Trading Coach - Brett Steenbarger', 'Trading in the Zone - Mark Douglas'],
    image: '',
    visualPrompt: 'Human brain silhouette: Intricate golden neural networks glowing against a dark obsidian background, calm and focused aesthetic, prestigious academic style.'
  },
  {
    id: 'GLO-606',
    title: 'Geopolitical Arbitrage & Frontier Markets',
    level: AcademicLevel.MASTERS,
    credits: 10,
    instructor: 'Marcus Vane',
    department: 'Global Strategy',
    description: 'Trading the world stage. Analyzing how geopolitical shifts, trade wars, and emerging market debt cycles create unique arbitrage opportunities for the sophisticated investor.',
    syllabus: ['Geopolitical Risk Modeling', 'Frontier Market Liquidity', 'Commodity Super-cycles', 'Sanction & Trade War Impact'],
    learningOutcomes: [
      'Map geopolitical events to specific asset class movements.',
      'Evaluate sovereign risk in frontier market debt.',
      'Construct arbitrage strategies across emerging market currencies.',
      'Analyze the impact of global supply chain shifts on commodity pricing.'
    ],
    readingList: ['The Accidental Superpower - Peter Zeihan', 'Prisoners of Geography - Tim Marshall'],
    image: '',
    visualPrompt: 'Global map projection: A holographic world map with golden trade routes and glowing geopolitical tension zones, dark high-tech command center feel, 8k.'
  }
];

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'LIB-001',
    title: 'Interbank Flow Analysis 2024',
    author: 'Julian Thorne',
    type: 'Research Paper',
    topic: 'Microstructure',
    year: 2024,
    description: 'Analyzing the shift in interbank liquidity during central bank rate pivots.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Prestige research paper cover: Minimalist graph showing liquidity waves, elegant serif font, institutional crest, parchment texture.'
  },
  {
    id: 'LIB-002',
    title: 'The Digital Sovereignty Manifesto',
    author: 'DLT Working Group',
    type: 'White Paper',
    topic: 'Blockchain',
    year: 2023,
    description: 'The roadmap for nation-state adoption of decentralized settlement layers.',
    coverImage: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Digital sovereignty whitepaper: A digital globe silhouette with interconnected golden networks, institutional blue, modern corporate design.'
  },
  {
    id: 'LIB-003',
    title: 'The Richest Man in Babylon (Classic)',
    author: 'George S. Clason',
    type: 'Textbook',
    topic: 'Wealth Management',
    year: 1926,
    description: 'Fundamental principles of financial success, often regarded as the primer for capital management.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Ancient Babylonian aesthetic: Clay tablets with golden cuneiform, sunrise over city walls, classic financial wisdom imagery.',
    pdfUrl: 'https://archive.org/download/TheRichestManInBabylon_201901/The%20Richest%20Man%20In%20Babylon.pdf'
  },
  {
    id: 'LIB-004',
    title: 'Think and Grow Rich (Full Archive)',
    author: 'Napoleon Hill',
    type: 'Textbook',
    topic: 'Psychology',
    year: 1937,
    description: 'The definitive work on the philosophy of personal achievement and the accumulation of wealth.',
    coverImage: 'https://images.unsplash.com/photo-1543004218-ee141104e3f3?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Vintage academic study room: A thick leather-bound book with gold foil title, a single candle, classic scholarly atmosphere.',
    pdfUrl: 'https://archive.org/download/ThinkAndGrowRichByNapoleonHill_201804/Think%20and%20Grow%20Rich%20by%20Napoleon%20Hill.pdf'
  },
  {
    id: 'LIB-005',
    title: 'The Theory of Money and Credit',
    author: 'Ludwig von Mises',
    type: 'Institutional Journal',
    topic: 'Economic Theory',
    year: 1912,
    description: 'An exhaustive exploration into the origin of value and the function of money in modern society.',
    coverImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Austrian economic aesthetic: Detailed sketches of gold coins and banknote textures, high-fidelity scholarly journal style.',
    pdfUrl: 'https://mises.org/sites/default/files/The%20Theory%20of%20Money%20and%20Credit_3.pdf'
  },
  {
    id: 'LIB-006',
    title: 'Satoshi Nakamoto: Bitcoin Whitepaper',
    author: 'Satoshi Nakamoto',
    type: 'White Paper',
    topic: 'Blockchain',
    year: 2008,
    description: 'The foundation of decentralized finance. A Peer-to-Peer Electronic Cash System.',
    coverImage: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Digital data matrix: Cascading green code forming a circular coin silhouette, high-tech cryptographic whitepaper cover.',
    pdfUrl: 'https://bitcoin.org/bitcoin.pdf'
  },
  {
     id: 'LIB-007',
     title: 'Reminiscences of a Stock Operator',
     author: 'Edwin Lefèvre',
     type: 'Textbook',
     topic: 'Market Psychology',
     year: 1923,
     description: 'A fictionalized biography of Jesse Livermore, often considered the best book ever written on the nature of speculation.',
     coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600',
     visualPrompt: 'Classic Wall Street office, early 20th century, ticker tape machines, dramatic shadows, prestige black and gold.',
     pdfUrl: 'https://archive.org/download/ReminiscencesOfAStockOperator/Reminiscences%20of%20a%20Stock%20Operator.pdf'
  }
];

export const FACULTY: Faculty[] = [
  {
    name: 'Julian Thorne',
    title: 'Chief Academic Strategist',
    expertise: 'Institutional Liquidity & Macro Policy',
    bio: 'Former head of global macro at a top-tier European fund with 25 years of institutional experience.',
    professionalHistory: [
      'Executive Director (Macro), Goldman Sachs London',
      'Lead Economist, ECB Liquidity Working Group',
      'Founder, AlphaStream Quantitative Research',
      'Ph.D. Economics, London School of Economics'
    ],
    keyPublications: [
      'The Liquidity Paradox: Market Depth in Times of Volatility (2022)',
      'Macro-cycle Entropy and the Decay of Fiat Settlement (2019)',
      'Interbank Flow & Central Bank Rate Pivots (2024)'
    ],
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
    officeHours: 'Tuesdays & Thursdays, 09:00 - 11:30 EST',
    visualPrompt: 'Senior male professor, mid-50s, refined features, bespoke dark suit, standing in a prestigious wood-paneled university library, soft warm lighting, authoritative.'
  },
  {
    name: 'Sarah Chen',
    title: 'Dean of Research',
    expertise: 'Quant Strategy & Emerging Assets',
    bio: 'Lead architect of multi-billion dollar algorithmic systems specializing in the FX/Crypto cross-over.',
    professionalHistory: [
      'Fellow, MIT Media Lab (Digital Currency Initiative)',
      'Senior Algorithmic Architect, Citadel Securities',
      'Technical Advisor to IMF on Digital Settlement Layers',
      'M.Sc. Computer Science (Quant Finance), Stanford University'
    ],
    keyPublications: [
      'Synthesizing Cross-Chain Liquidity: An Institutional Framework (2023)',
      'Non-Linear Execution in Fragmented FX Markets (2021)',
      'Algorithmic Alpha & Quantitative Systems V2 (2024)'
    ],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&get=80&w=600',
    officeHours: 'Mondays & Wednesdays, 14:00 - 16:30 EST',
    visualPrompt: 'Female quantitative researcher, early 40s, intelligent gaze, professional attire, modern minimalist glass office with glowing trading terminal in background, 8k.'
  }
];

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'NEWS-001',
    title: 'Institutional Pivot: The 2024 Interest Rate Outlook',
    date: 'March 15, 2024',
    category: 'Market Alert',
    summary: 'Our faculty analyzes the upcoming central bank policy shifts and their impact on global liquidity pools.',
    image: 'https://images.unsplash.com/photo-1611974717482-480f28a7e58a?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Institutional news banner: A golden clock face overlapping with a falling interest rate graph, navy blue background, sharp corporate style.'
  },
  {
    id: 'NEWS-002',
    title: 'GTI Research Lab Achieves On-Chain Analysis Breakthrough',
    date: 'March 10, 2024',
    category: 'Research',
    summary: 'A new proprietary model for identifying institutional accumulation phases in digital asset markets has been verified.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Scientific data breakthrough: A complex digital network diagram showing glowing connection nodes, golden light, high-tech research aesthetic.'
  },
  {
    id: 'NEWS-003',
    title: 'Global Trading Institute Opens London Academic Hub',
    date: 'March 05, 2024',
    category: 'Institutional',
    summary: 'Expanding our physical presence to the heart of the world\'s largest FX trading hub.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
    visualPrompt: 'Modern institutional architecture: A sleek glass and steel building in London at dusk, golden internal lights, prestigious financial center feel.'
  }
];
