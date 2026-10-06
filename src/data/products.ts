export interface DigitalProduct {
  id: string;
  sku: string;
  name: string;
  category: 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting';
  priceUSD: number;
  pricePI: number;
  description: string;
  longDescription: string;
  features: string[];
  image: string;
  altText: string;
  fileSize: string;
  downloadCount: string;
  downloadUrl: string;
}

export const OFFICIAL_PRODUCTS: DigitalProduct[] = [
  {
    id: "prod-course-mba",
    sku: "SKU-SIR-MBA-ACC",
    name: "MBA Digital Acceleration Program",
    category: "courses",
    priceUSD: 99.00,
    pricePI: 10.00,
    description: "Accelerate your executive credentials with advanced corporate management modules, leadership strategies, and digital scaling blueprints.",
    longDescription: "Our premier Digital MBA masterclass designed specifically for founders, executives, and high-growth team leaders. Master core business execution frameworks, administrative operations, scaling strategies, and corporate governance.",
    features: [
      "24 advanced video modules",
      "Certified MBA completion badge",
      "Case studies of unicorn company strategies",
      "Interactive study guides and templates"
    ],
    image: "/assets/programmes/classroom_opt.jpg",
    altText: "Executive classroom with presentation board",
    fileSize: "48.2 MB",
    downloadCount: "2,480+ Downloads",
    downloadUrl: "/downloads/sirwise-mba-program-kit.zip"
  },
  {
    id: "prod-ebook-sovereign",
    sku: "SKU-SIR-SOV-WEALTH",
    name: "Sovereign Wealth Guide",
    category: "ebooks",
    priceUSD: 49.00,
    pricePI: 5.00,
    description: "The ultimate blueprint to understanding global capital flows, asset protection, and wealth accumulation guides.",
    longDescription: "A premium corporate asset management playbook covering macro-economic capital flow dynamics, international corporate structures, asset security, tax mitigation, and wealth diversification strategies.",
    features: [
      "250-page deep-dive PDF handbook",
      "Sovereign portfolio asset allocations matrices",
      "Jurisdiction-specific legal comparison maps",
      "Wealth generation worksheet templates"
    ],
    image: "/assets/programmes/finance_globe.jpg",
    altText: "Globe with financial projection indicators",
    fileSize: "12.4 MB",
    downloadCount: "3,150+ Downloads",
    downloadUrl: "/downloads/sirwise-sovereign-wealth-guide.pdf"
  },
  {
    id: "prod-temp-pitch",
    sku: "SKU-SIR-PITCH-DECK",
    name: "Venture Pitch Deck Master Template",
    category: "templates",
    priceUSD: 59.00,
    pricePI: 6.00,
    description: "Raise capital instantly with our structured pitch framework utilized by global start-ups to raise millions.",
    longDescription: "Save hundreds of hours designing your investor presentation slides. Formatted specifically to tell an impactful commercial narrative that grabs venture capitalists, angel networks, and banks.",
    features: [
      "100+ highly customizable PPTX slide layouts",
      "Detailed financial model slides placeholders",
      "Curated pitch fonts & icon assets",
      "Step-by-step presentation narrative notes"
    ],
    image: "/assets/programmes/financial_modeler.jpg",
    altText: "Venture capital pitch presentation boards",
    fileSize: "18.7 MB",
    downloadCount: "1,890+ Downloads",
    downloadUrl: "/downloads/sirwise-venture-pitch-deck.zip"
  },
  {
    id: "prod-saas-ledger",
    sku: "SKU-SIR-LEDGER-ACC",
    name: "LedgerWise Cloud Accounting Software",
    category: "saas",
    priceUSD: 79.00,
    pricePI: 8.00,
    description: "Streamline your bookkeeping, balance sheets, and invoicing with our customized, offline-first cloud accountant.",
    longDescription: "A robust cloud-based billing and cash flow bookkeeping tool optimized for small businesses, contractors, and agencies. Automatically compile financial ledgers, draft balance sheets, track expenses, and issue client invoices.",
    features: [
      "Comprehensive billing & invoice creator",
      "Dynamic balance sheet automator",
      "Localized tax configuration matrices",
      "Multi-user permission levels settings"
    ],
    image: "/assets/programmes/accounting_dashboard.jpg",
    altText: "Interactive cloud accounting dashboard interface",
    fileSize: "32.1 MB",
    downloadCount: "1,420+ Downloads",
    downloadUrl: "/downloads/sirwise-ledgerwise-software.zip"
  },
  {
    id: "prod-asset-media",
    sku: "SKU-SIR-MEDIA-VAULT",
    name: "Creative Media Asset Vault",
    category: "assets",
    priceUSD: 69.00,
    pricePI: 7.00,
    description: "Unbox over 10,000 royalty-free high-definition graphics, studio-recorded audio background packs, and UI templates.",
    longDescription: "Elevate your creative production value. This massive collection gives developers, designers, and marketers royalty-free assets to launch high-fidelity websites, landing pages, social media campaigns, and videos.",
    features: [
      "5,000+ high-definition premium vector icons",
      "1,500+ studio-recorded audio loops",
      "Responsive HTML5/Tailwind wireframe pages",
      "Elite Adobe Illustrator & Figma sources"
    ],
    image: "/assets/programmes/media_assets.jpg",
    altText: "Collage of premium artistic media assets",
    fileSize: "154.5 MB",
    downloadCount: "4,600+ Downloads",
    downloadUrl: "/downloads/sirwise-creative-media-vault.zip"
  },
  {
    id: "prod-consult-mentorship",
    sku: "SKU-SIR-CONSULT-MENT",
    name: "Elite Consulting & Mentorship Session",
    category: "consulting",
    priceUSD: 199.00,
    pricePI: 20.00,
    description: "Secure a direct 1-on-1 virtual conference with certified senior digital business specialists and tax attorneys.",
    longDescription: "Fast-track your corporate setup, immigration steps, or system development hurdles. Book a private, screen-sharing strategy meeting to audit your operational models and design a roadmap.",
    features: [
      "60-minute direct video call meeting",
      "Custom corporate blueprint roadmap delivery",
      "Complete call audio & screen recording files",
      "Direct WhatsApp follow-up contact line"
    ],
    image: "/assets/programmes/professional_meeting.jpg",
    altText: "Professional business discussion and video call consultation",
    fileSize: "3.1 MB",
    downloadCount: "870+ Bookings",
    downloadUrl: "/downloads/sirwise-consulting-booking.pdf"
  },
  {
    id: "prod-temp-calc",
    sku: "SKU-SIR-VAL-CALC",
    name: "Professional Valuation Calculators Package",
    category: "templates",
    priceUSD: 49.00,
    pricePI: 5.00,
    description: "Instantly calculate enterprise valuations, DCF models, internal rate of returns, and liquidity scenarios.",
    longDescription: "Equip your finance team with elite corporate valuation models. Includes Discounted Cash Flow (DCF), Net Present Value (NPV), Weighted Average Cost of Capital (WACC), and merger analysis spreadsheets.",
    features: [
      "Complex multi-sheet valuation Excel files",
      "Automated DCF modeling instructions",
      "NPV, IRR, and payback period graphs",
      "Equity dilution capitalization charts"
    ],
    image: "/assets/programmes/financial_spreadsheet.jpg",
    altText: "Corporate spreadsheet dashboard with performance charts",
    fileSize: "9.8 MB",
    downloadCount: "2,190+ Downloads",
    downloadUrl: "/downloads/sirwise-valuation-calculators.zip"
  },
  {
    id: "prod-course-ai",
    sku: "SKU-SIR-AI-PROF",
    name: "AI Professor Masterclass & Toolkit",
    category: "saas",
    priceUSD: 89.00,
    pricePI: 9.00,
    description: "Master large language modeling, API integrations, and automate client pipelines in this extensive toolkit.",
    longDescription: "The ultimate AI training blueprint. Build custom system instructions context parameters, program local node interfaces, fine-tune models, and deploy automated agent loops in your business.",
    features: [
      "Complete AI Professor system context framework",
      "Hands-on node scripting guidelines",
      "1,000+ elite business automation prompts",
      "API integration files & sandbox keys"
    ],
    image: "/assets/programmes/virtual_tutor.jpg",
    altText: "Futuristic virtual tutor with projection charts",
    fileSize: "41.5 MB",
    downloadCount: "3,820+ Downloads",
    downloadUrl: "/downloads/sirwise-ai-professor-blueprint.zip"
  }
];
