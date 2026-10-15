import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Globe, 
  Users, 
  TrendingUp, 
  Search,
  Home,
  Sparkles,
  Database,
  ArrowRight,
  Zap,
  Award,
  Sliders,
  RefreshCw,
  Trash2,
  Calendar,
  MapPin,
  Target,
  ChevronRight,
  Download,
  BarChart2,
  Check,
  Copy
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8001';

// CSV Export Helper
const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Premium Glassmorphism Skeleton Loading Indicators
const SkeletonStats = () => (
  <div className="stats-grid">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="skeleton-card skeleton-pulse">
        <div className="skeleton-line value"></div>
        <div className="skeleton-line label"></div>
      </div>
    ))}
  </div>
);

const SkeletonCharts = () => (
  <div className="charts-grid">
    <div className="skeleton-chart-box skeleton-pulse">
      <div className="spinner"></div>
    </div>
    <div className="skeleton-chart-box skeleton-pulse">
      <div className="spinner"></div>
    </div>
  </div>
);

// Summer Olympic Hosts geography coordinates mapping
const HOST_CITIES = [
  { name: "Athens", country: "Greece", year: "1896, 2004", x: 490, y: 155, athletes: 10625, nations: 201 },
  { name: "Paris", country: "France", year: "1900, 1924, 2024", x: 450, y: 135, athletes: 10714, nations: 206 },
  { name: "St. Louis", country: "USA", year: "1904", x: 230, y: 145, athletes: 651, nations: 12 },
  { name: "London", country: "UK", x: 440, y: 120, year: "1908, 1948, 2012", athletes: 10568, nations: 204 },
  { name: "Stockholm", country: "Sweden", x: 475, y: 95, year: "1912", athletes: 2408, nations: 28 },
  { name: "Antwerp", country: "Belgium", x: 455, y: 128, year: "1920", athletes: 2626, nations: 29 },
  { name: "Amsterdam", country: "Netherlands", x: 457, y: 124, year: "1928", athletes: 2883, nations: 46 },
  { name: "Los Angeles", country: "USA", x: 180, y: 160, year: "1932, 1984, 2028", athletes: 10500, nations: 200 },
  { name: "Berlin", country: "Germany", x: 470, y: 125, year: "1936", athletes: 3963, nations: 49 },
  { name: "Helsinki", country: "Finland", x: 505, y: 85, year: "1952", athletes: 4955, nations: 69 },
  { name: "Melbourne", country: "Australia", x: 725, y: 335, year: "1956", athletes: 3184, nations: 67 },
  { name: "Rome", country: "Italy", x: 472, y: 155, year: "1960", athletes: 5338, nations: 83 },
  { name: "Tokyo", country: "Japan", x: 695, y: 165, year: "1964, 2020", athletes: 11420, nations: 205 },
  { name: "Mexico City", country: "Mexico", x: 210, y: 195, year: "1968", athletes: 5516, nations: 112 },
  { name: "Munich", country: "Germany", x: 472, y: 134, year: "1972", athletes: 7134, nations: 121 },
  { name: "Montreal", country: "Canada", x: 275, y: 125, year: "1976", athletes: 6084, nations: 92 },
  { name: "Moscow", country: "Russia", x: 525, y: 110, year: "1980", athletes: 5179, nations: 80 },
  { name: "Seoul", country: "South Korea", x: 675, y: 168, year: "1988", athletes: 8391, nations: 159 },
  { name: "Barcelona", country: "Spain", x: 445, y: 152, year: "1992", athletes: 9356, nations: 169 },
  { name: "Atlanta", country: "USA", x: 245, y: 155, year: "1996", athletes: 10318, nations: 197 },
  { name: "Sydney", country: "Australia", x: 735, y: 328, year: "2000", athletes: 10651, nations: 199 },
  { name: "Beijing", country: "China", x: 655, y: 155, year: "2008", athletes: 10942, nations: 204 },
  { name: "Rio de Janeiro", country: "Brazil", x: 365, y: 275, year: "2016", athletes: 11238, nations: 207 },
  { name: "Brisbane", country: "Australia", x: 745, y: 315, year: "2032", athletes: "TBD", nations: "TBD" }
];

// Legendary Olympic Records
const OLYMPIC_RECORDS = [
  { title: "Michael Phelps", subtitle: "Swimming (USA)", desc: "The most decorated Olympian of all time with 28 medals, including 23 Golds. Set the all-time record for individual Olympic Golds.", highlight: "28 Medals / 23 Golds" },
  { title: "Usain Bolt", subtitle: "Athletics (Jamaica)", desc: "The fastest human in history. Achieved the legendary sprint 'triple-double', winning 100m and 200m Gold in three consecutive Olympics (2008–2016).", highlight: "100m in 9.58s / 8 Golds" },
  { title: "Nadia Comăneci", subtitle: "Gymnastics (Romania)", desc: "At age 14, scored the first ever perfect 10.0 in Olympic gymnastics history at Montreal 1976. Went on to score seven perfect 10s and win 5 Golds.", highlight: "First Perfect 10.0 / 5 Golds" },
  { title: "Larisa Latynina", subtitle: "Gymnastics (USSR)", desc: "Won 18 Olympic medals (9 Gold, 5 Silver, 4 Bronze) in gymnastics. Held the record for the most Olympic medals for nearly half a century until Michael Phelps.", highlight: "18 Medals / 9 Golds" },
  { title: "Jesse Owens", subtitle: "Athletics (USA)", desc: "Won 4 Gold medals (100m, 200m, long jump, 4x100m) at Berlin 1936, single-handedly crushing the racial supremacy narrative of the host country.", highlight: "4 Golds in 1936 Berlin" },
  { title: "Carl Lewis", subtitle: "Athletics (USA)", desc: "One of only three athletes to win gold in the same individual event (long jump) in four consecutive Olympic Games (1984–1996) alongside 9 career Golds.", highlight: "9 Golds / 4 Consecutive" },
  { title: "Bob Beamon", subtitle: "Athletics (USA)", desc: "Set a legendary world record of 8.90m in the Long Jump at Mexico City 1968 that stood for 23 years, shattering the previous record by 55cm.", highlight: "8.90m Long Jump Record" }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [filters, setFilters] = useState({ years: [], countries: [], sports: [] });
  const [loading, setLoading] = useState(true);

  // Tab: Overall states
  const [overallStats, setOverallStats] = useState(null);
  const [overallCharts, setOverallCharts] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [mostSuccessful, setMostSuccessful] = useState([]);
  const [selectedSportOverall, setSelectedSportOverall] = useState('overall');

  // Hosting geography details selection
  const [selectedCityName, setSelectedCityName] = useState('Paris'); // default active selected city
  const [selectedCityDetails, setSelectedCityDetails] = useState(null);
  const [cityDetailsLoading, setCityDetailsLoading] = useState(false);
  const [hostFilter, setHostFilter] = useState('');

  // Tab: Medal Tally states
  const [medalTally, setMedalTally] = useState([]);
  const [selectedYearTally, setSelectedYearTally] = useState('overall');
  const [selectedCountryTally, setSelectedCountryTally] = useState('overall');
  const [tallySearch, setTallySearch] = useState('');

  // Tab: Country Analysis states
  const [selectedCountryAnalysis, setSelectedCountryAnalysis] = useState('India');
  const [countryData, setCountryData] = useState(null);
  const [countryLoading, setCountryLoading] = useState(false);

  // Tab: Country Comparison states
  const [country1, setCountry1] = useState('USA');
  const [country2, setCountry2] = useState('China');
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Tab: Medal Predictor states
  const [predictCountry, setPredictCountry] = useState('India');
  const [predictYear, setPredictYear] = useState(2028);
  const [predictData, setPredictData] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [delegationOverride, setDelegationOverride] = useState(null);

  // Tab: Athlete Analysis states
  const [selectedSportAthlete, setSelectedSportAthlete] = useState('overall');
  const [athleteData, setAthleteData] = useState(null);
  const [athleteLoading, setAthleteLoading] = useState(false);

  // Carousel slider state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'oracle', text: "Hello! I am the **Olympics Oracle** research assistant. Ask me historical stats, standings, or future forecasts!" }
  ]);
  const chatBottomRef = useRef(null);

  // Load basic filters
  useEffect(() => {
    fetch(`${API_BASE}/api/filters`)
      .then(res => res.json())
      .then(data => {
        setFilters(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching filters:", err);
        setLoading(false);
      });
  }, []);

  // Tab 1: Load Overall Data
  useEffect(() => {
    if (activeTab === 'overall') {
      setLoading(true);
      Promise.all([
        fetch(`${API_BASE}/api/overall-stats`).then(res => res.json()),
        fetch(`${API_BASE}/api/overall-charts`).then(res => res.json()),
        fetch(`${API_BASE}/api/sport-heatmap`).then(res => res.json())
      ])
        .then(([stats, charts, heatmap]) => {
          setOverallStats(stats);
          setOverallCharts(charts);
          setHeatmapData(heatmap);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading overall analysis:", err);
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Tab 1: Load selected city details summary
  useEffect(() => {
    if (activeTab === 'overall' && selectedCityName) {
      setCityDetailsLoading(true);
      fetch(`${API_BASE}/api/host-details?city=${encodeURIComponent(selectedCityName)}`)
        .then(res => res.json())
        .then(data => {
          setSelectedCityDetails(data);
          setCityDetailsLoading(false);
        })
        .catch(err => {
          console.error("Error loading host details:", err);
          setCityDetailsLoading(false);
        });
    }
  }, [selectedCityName, activeTab]);

  // Tab 1: Load Most Successful Athletes
  useEffect(() => {
    if (activeTab === 'overall') {
      fetch(`${API_BASE}/api/most-successful?sport=${selectedSportOverall}`)
        .then(res => res.json())
        .then(data => setMostSuccessful(data))
        .catch(err => console.error("Error fetching successful athletes:", err));
    }
  }, [selectedSportOverall, activeTab]);

  // Tab 2: Load Medal Tally Data
  useEffect(() => {
    if (activeTab === 'tally') {
      setLoading(true);
      fetch(`${API_BASE}/api/medal-tally?year=${selectedYearTally}&country=${selectedCountryTally}`)
        .then(res => res.json())
        .then(data => {
          setMedalTally(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading medal tally:", err);
          setLoading(false);
        });
    }
  }, [activeTab, selectedYearTally, selectedCountryTally]);

  // Tab 3: Load Country Analysis Data
  useEffect(() => {
    if (activeTab === 'country' && selectedCountryAnalysis) {
      setCountryLoading(true);
      fetch(`${API_BASE}/api/country-analysis?country=${encodeURIComponent(selectedCountryAnalysis)}`)
        .then(res => res.json())
        .then(data => {
          setCountryData(data);
          setCountryLoading(false);
        })
        .catch(err => {
          console.error("Error loading country analysis:", err);
          setCountryLoading(false);
        });
    }
  }, [activeTab, selectedCountryAnalysis]);

  // Tab: Load Comparison Data
  useEffect(() => {
    if (activeTab === 'comparison' && country1 && country2) {
      setComparisonLoading(true);
      fetch(`${API_BASE}/api/comparison?country1=${encodeURIComponent(country1)}&country2=${encodeURIComponent(country2)}`)
        .then(res => res.json())
        .then(data => {
          setComparisonData(data);
          setComparisonLoading(false);
        })
        .catch(err => {
          console.error("Error loading comparison:", err);
          setComparisonLoading(false);
        });
    }
  }, [activeTab, country1, country2]);

  // Reset override on country shift
  useEffect(() => {
    setDelegationOverride(null);
  }, [predictCountry]);

  // Tab: Fetch Prediction Handler
  useEffect(() => {
    if (activeTab === 'predictor' && predictCountry) {
      setPredictLoading(true);
      const delParam = delegationOverride !== null ? `&delegation=${delegationOverride}` : '';
      fetch(`${API_BASE}/api/predict?country=${encodeURIComponent(predictCountry)}&year=${predictYear}${delParam}`)
        .then(res => res.json())
        .then(data => {
          setPredictData(data);
          setPredictLoading(false);
        })
        .catch(err => {
          console.error("Error loading predictions:", err);
          setPredictLoading(false);
        });
    }
  }, [activeTab, predictCountry, predictYear, delegationOverride]);

  // Tab 4: Load Athlete Analysis Data
  useEffect(() => {
    if (activeTab === 'athlete') {
      setAthleteLoading(true);
      fetch(`${API_BASE}/api/athlete-analysis?sport=${encodeURIComponent(selectedSportAthlete)}`)
        .then(res => res.json())
        .then(data => {
          setAthleteData(data);
          setAthleteLoading(false);
        })
        .catch(err => {
          console.error("Error loading athlete analysis:", err);
          setAthleteLoading(false);
        });
    }
  }, [activeTab, selectedSportAthlete]);

  // Chat message submit handler
  const handleChatSubmit = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
      .then(res => res.json())
      .then(data => {
        setChatMessages(prev => [...prev, { sender: 'oracle', text: data.response }]);
        setChatLoading(false);
      })
      .catch(err => {
        console.error("Chat error:", err);
        setChatMessages(prev => [...prev, { sender: 'oracle', text: "Error executing localized database queries." }]);
        setChatLoading(false);
      });
  };

  // Clear/Reset chatbot thread
  const clearChat = () => {
    setChatMessages([
      { sender: 'oracle', text: "Hello! I am the **Olympics Oracle** research assistant. Ask me historical stats, standings, or future forecasts!" }
    ]);
  };

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Custom Heatmap cell helper
  const getCellLevel = (val) => {
    if (val === 0) return 'cell-level-0';
    if (val <= 5) return 'cell-level-1';
    if (val <= 15) return 'cell-level-2';
    if (val <= 25) return 'cell-level-3';
    return 'cell-level-4';
  };

  // Tab metadata for top breadcrumbs
  const getTabMeta = (tab) => {
    switch (tab) {
      case 'home': return { category: 'Platform Overview', title: 'Executive Overview' };
      case 'overall': return { category: 'Core Analytics', title: 'Overall Historical Trends' };
      case 'tally': return { category: 'Performance', title: 'Medal Tally Standings' };
      case 'country': return { category: 'National Intelligence', title: 'Country-wise Analytics' };
      case 'comparison': return { category: 'Benchmarking', title: 'Head-to-Head Comparison' };
      case 'predictor': return { category: 'Forecasting Engine', title: 'LA 2028 Medal Predictor' };
      case 'records': return { category: 'Hall of Fame', title: 'Legendary Records' };
      case 'athlete': return { category: 'Biometrics', title: 'Athlete Physical Profile' };
      default: return { category: 'Intelligence', title: 'Analytics Dashboard' };
    }
  };

  return (
    <div className="app-container">
      {/* Glassmorphic Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">
            <Trophy size={22} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <h1>Olympics Vault</h1>
            <span className="sidebar-version-tag">Global Vault Edition</span>
          </div>
        </div>

        <ul className="nav-links">
          <li className="nav-group-label">Platform Core</li>
          <li 
            className={`nav-item nav-home ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home />
            <span>Home</span>
          </li>
          <li 
            className={`nav-item nav-overall ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            <TrendingUp />
            <span>Overall Analysis</span>
          </li>
          <li 
            className={`nav-item nav-tally ${activeTab === 'tally' ? 'active' : ''}`}
            onClick={() => setActiveTab('tally')}
          >
            <Trophy />
            <span>Medal Tally</span>
          </li>

          <li className="nav-group-label">Intelligence & Forecasts</li>
          <li 
            className={`nav-item nav-country ${activeTab === 'country' ? 'active' : ''}`}
            onClick={() => setActiveTab('country')}
          >
            <Globe />
            <span>Country-wise</span>
          </li>
          <li 
            className={`nav-item nav-comparison ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <Target />
            <span>Country Comparison</span>
          </li>
          <li 
            className={`nav-item nav-predictor ${activeTab === 'predictor' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictor')}
          >
            <Sliders />
            <span>Medal Predictor</span>
          </li>

          <li className="nav-group-label">Historical Vault</li>
          <li 
            className={`nav-item nav-records ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <Award />
            <span>Legendary Records</span>
          </li>
          <li 
            className={`nav-item nav-athlete ${activeTab === 'athlete' ? 'active' : ''}`}
            onClick={() => setActiveTab('athlete')}
          >
            <Users />
            <span>Athlete Profile</span>
          </li>
        </ul>

        {/* Sidebar Footer AI Assistant Teaser */}
        <div className="sidebar-footer-card" onClick={() => setChatOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <Sparkles size={16} color="#c084fc" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Olympics Oracle</span>
          </div>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Interactive research assistant. Ask historical questions in natural language.
          </p>
        </div>
      </nav>

      {/* Main Panel Content */}
      <main className="main-content">

        {/* Top Command Bar & Status Header */}
        <header className="top-bar">
          <div className="breadcrumb-nav">
            <span>Olympics Vault</span>
            <ChevronRight size={13} color="#64748b" />
            <span>{getTabMeta(activeTab).category}</span>
            <ChevronRight size={13} color="#64748b" />
            <span className="current-crumb">{getTabMeta(activeTab).title}</span>
          </div>

          <div className="top-bar-actions">
            <div className="status-badge-live">
              <span className="status-dot-pulse"></span>
              <span>Database Connected (270k+ Records)</span>
            </div>

            <button 
              className="quick-action-btn"
              onClick={() => setChatOpen(!chatOpen)}
              title="Toggle Olympics Oracle Assistant"
            >
              <Sparkles size={13} color="#c084fc" />
              <span>Oracle Assistant</span>
            </button>
          </div>
        </header>

        {/* TAB 0: HOME LANDING PAGE */}
        {activeTab === 'home' && (
          <div className="tab-pane">
            <div className="hero-section">
              <div className="hero-badge-pill">
                <Sparkles size={14} />
                <span>Global Olympic Intelligence & Future Forecasting</span>
              </div>
              <h2 className="hero-title">Olympics Vault</h2>
              <p className="hero-subtitle">
                An advanced database indexing and predictive analysis suite mapping 120+ years of Summer Olympic history. Explore dynamic rosters, test forecasting models, and query statistics via natural language.
              </p>
              <div className="hero-buttons">
                <button className="cta-button primary" onClick={() => setActiveTab('overall')}>
                  <BarChart2 size={18} />
                  <span>Explore Analytics</span>
                  <ArrowRight size={16} />
                </button>
                <button className="cta-button secondary" onClick={() => setActiveTab('predictor')}>
                  <Sliders size={18} />
                  <span>Run Future Predictor</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Achievements Stats Grid */}
            <div className="home-stats-grid">
              <div className="home-stat-card theme-cyan">
                <div className="home-stat-icon-wrap"><Calendar size={20} /></div>
                <div className="home-stat-val">30</div>
                <div className="home-stat-lbl">Summer Editions</div>
                <div className="home-stat-sub">1896 Athens – 2024 Paris</div>
              </div>
              <div className="home-stat-card theme-emerald">
                <div className="home-stat-icon-wrap"><Globe size={20} /></div>
                <div className="home-stat-val">207</div>
                <div className="home-stat-lbl">Countries Mapped</div>
                <div className="home-stat-sub">National Olympic Committees</div>
              </div>
              <div className="home-stat-card theme-violet">
                <div className="home-stat-icon-wrap"><Users size={20} /></div>
                <div className="home-stat-val">150K+</div>
                <div className="home-stat-lbl">Athletes Indexed</div>
                <div className="home-stat-sub">Biometrics & Event History</div>
              </div>
              <div className="home-stat-card theme-amber">
                <div className="home-stat-icon-wrap"><Award size={20} /></div>
                <div className="home-stat-val">39K+</div>
                <div className="home-stat-lbl">Medals Tracked</div>
                <div className="home-stat-sub">Gold, Silver & Bronze Records</div>
              </div>
            </div>

            {/* Feature Exploration Grid */}
            <h3 className="features-section-title">Platform Capabilities</h3>
            <p className="features-section-desc">Click any of the core application capabilities below to navigate to their specialized analytical dashboards.</p>
            
            <div className="feature-shortcuts-grid">
              <div className="feature-shortcut-card card-rose" onClick={() => setActiveTab('predictor')}>
                <div className="feature-shortcut-icon"><Sliders size={22} /></div>
                <h4 className="feature-shortcut-title">LA 2028 Medal Predictor</h4>
                <p className="feature-shortcut-text">
                  Simulate upcoming medal distribution forecasts based on delegation size, historical performance, and host nation advantage.
                </p>
                <div className="feature-shortcut-link">
                  <span>Open Predictor</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div className="feature-shortcut-card card-cyan" onClick={() => setActiveTab('overall')}>
                <div className="feature-shortcut-icon"><BarChart2 size={22} /></div>
                <h4 className="feature-shortcut-title">Interactive Host Standings</h4>
                <p className="feature-shortcut-text">
                  Browse custom profiles, participation levels, and top country standings across all historic summer host cities.
                </p>
                <div className="feature-shortcut-link">
                  <span>Open Host Profile</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div className="feature-shortcut-card card-emerald" onClick={() => setActiveTab('comparison')}>
                <div className="feature-shortcut-icon"><Globe size={22} /></div>
                <h4 className="feature-shortcut-title">Country Benchmarking</h4>
                <p className="feature-shortcut-text">
                  Benchmark physical attributes (height, weight, age) and medal output of competing delegations side-by-side.
                </p>
                <div className="feature-shortcut-link">
                  <span>Compare Countries</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div className="feature-shortcut-card card-amber" onClick={() => setActiveTab('records')}>
                <div className="feature-shortcut-icon"><Trophy size={22} /></div>
                <h4 className="feature-shortcut-title">Legendary Records</h4>
                <p className="feature-shortcut-text">
                  Explore a curated timeline of the most iconic, record-shattering athletic achievements in Olympic history.
                </p>
                <div className="feature-shortcut-link">
                  <span>View Records</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERALL ANALYSIS */}
        {activeTab === 'overall' && (
          <div className="tab-pane">
            <div className="flex-between">
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-cyan">
                  <TrendingUp size={12} />
                  <span>Global Growth & Historical Analytics</span>
                </div>
                <h2>Olympic Games Overview</h2>
                <p>Aggregated metrics and growth trends spanning all Summer Olympic editions since 1896.</p>
              </div>
              <button 
                className="btn-glass"
                onClick={() => exportToCSV(overallCharts, "olympics_overall_growth.csv")}
                disabled={!overallCharts || overallCharts.length === 0}
              >
                Export Growth CSV
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}></div>

            {loading ? (
              <>
                <SkeletonStats />
                <SkeletonCharts />
              </>
            ) : (
              <>
                {/* Top Statistics Cards */}
                {overallStats && (
                  <div className="stats-grid">
                    <div className="stat-card theme-cyan">
                      <div className="stat-card-icon-wrap"><Calendar size={20} /></div>
                      <span className="stat-value">{overallStats.editions}</span>
                      <span className="stat-label">Editions</span>
                      <span className="stat-subtext">1896 – 2024 Games</span>
                    </div>
                    <div className="stat-card theme-amber">
                      <div className="stat-card-icon-wrap"><MapPin size={20} /></div>
                      <span className="stat-value">{overallStats.hosts}</span>
                      <span className="stat-label">Host Cities</span>
                      <span className="stat-subtext">Global Host Metropolises</span>
                    </div>
                    <div className="stat-card theme-orange">
                      <div className="stat-card-icon-wrap"><Zap size={20} /></div>
                      <span className="stat-value">{overallStats.sports}</span>
                      <span className="stat-label">Sports</span>
                      <span className="stat-subtext">Summer Disciplines</span>
                    </div>
                    <div className="stat-card theme-rose">
                      <div className="stat-card-icon-wrap"><Target size={20} /></div>
                      <span className="stat-value">{overallStats.events}</span>
                      <span className="stat-label">Events</span>
                      <span className="stat-subtext">Competitive Categories</span>
                    </div>
                    <div className="stat-card theme-emerald">
                      <div className="stat-card-icon-wrap"><Globe size={20} /></div>
                      <span className="stat-value">{overallStats.nations}</span>
                      <span className="stat-label">Nations</span>
                      <span className="stat-subtext">National Olympic Delegations</span>
                    </div>
                    <div className="stat-card theme-violet">
                      <div className="stat-card-icon-wrap"><Users size={20} /></div>
                      <span className="stat-value">{overallStats.athletes.toLocaleString()}</span>
                      <span className="stat-label">Athletes</span>
                      <span className="stat-subtext">Complete Indexed Rosters</span>
                    </div>
                  </div>
                )}

                {/* Premium Interactive Host City Gallery */}
                <div className="glass-card">
                  <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <h3>Historical Olympic Host Cities</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Select a host city to view historical games participation, delegation size, and top country standings.
                      </p>
                    </div>
                    <div style={{ position: 'relative', width: '250px' }}>
                      <input 
                        type="text"
                        placeholder="Search city or country..."
                        value={hostFilter}
                        onChange={(e) => setHostFilter(e.target.value)}
                        className="search-input"
                        style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.2rem', fontSize: '0.85rem' }}
                      />
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                  
                  <div className="host-city-grid">
                    {HOST_CITIES.filter(c => 
                      c.name.toLowerCase().includes(hostFilter.toLowerCase()) || 
                      c.country.toLowerCase().includes(hostFilter.toLowerCase())
                    ).map((city, idx) => (
                      <div 
                        key={idx} 
                        className={`host-city-card ${selectedCityName === city.name ? 'active' : ''}`}
                        onClick={() => setSelectedCityName(city.name)}
                      >
                        <div className="host-city-name">{city.name}</div>
                        <div className="host-city-country">{city.country}</div>
                        <div className="host-city-years">📅 {city.year}</div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Click-to-View Podium Drawer */}
                  {selectedCityName && (
                    <div className="host-drawer" style={{ background: 'rgba(0, 0, 0, 0.15)', marginTop: 0, border: 'none' }}>
                      <div className="host-drawer-header">
                        <h4>📊 Host City Standings: {selectedCityName}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Detailed edition-specific total metrics and the official Top 3 country standing podium.
                        </p>
                      </div>

                      {cityDetailsLoading ? (
                        <div className="loader-container" style={{ gridColumn: '1 / -1', padding: '2rem 0' }}>
                          <div className="spinner"></div>
                          <p>Loading {selectedCityName} records...</p>
                        </div>
                      ) : selectedCityDetails && selectedCityDetails.editions ? (
                        selectedCityDetails.editions.map((edition, idx) => (
                          <React.Fragment key={idx}>
                            {/* Stats */}
                            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)' }}>
                              <h5 style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '1rem' }}>
                                🏅 Summer Games {edition.year}
                              </h5>
                              <div className="prediction-details-list" style={{ marginTop: 0 }}>
                                <div className="prediction-detail-item">
                                  <span>Nations Attended</span>
                                  <span>{edition.nations} countries</span>
                                </div>
                                <div className="prediction-detail-item">
                                  <span>Competitors Count</span>
                                  <span>{edition.athletes.toLocaleString()} athletes</span>
                                </div>
                                <div className="prediction-detail-item">
                                  <span>Sports Organized</span>
                                  <span>{edition.sports} sports</span>
                                </div>
                                <div className="prediction-detail-item">
                                  <span>Medal Events Conducted</span>
                                  <span>{edition.events} events</span>
                                </div>
                              </div>
                            </div>

                            {/* Podium (Columns structure matching standard podium 2nd-1st-3rd) */}
                            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.015)' }}>
                              <h5 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', textAlign: 'left', marginBottom: '0.5rem' }}>
                                🏆 Country Standing Podium
                              </h5>
                              <div className="podium-box">
                                {/* Rank 2 */}
                                {edition.podium.find(p => p.rank === 2) && (
                                  <div className="podium-col rank-2" title={`${edition.podium.find(p => p.rank === 2).country}: ${edition.podium.find(p => p.rank === 2).Gold} Gold`}>
                                    <div className="podium-medal">🥈</div>
                                    <div className="podium-country">{edition.podium.find(p => p.rank === 2).country}</div>
                                    <div className="podium-score">{edition.podium.find(p => p.rank === 2).Gold} G</div>
                                  </div>
                                )}
                                {/* Rank 1 */}
                                {edition.podium.find(p => p.rank === 1) && (
                                  <div className="podium-col rank-1" title={`${edition.podium.find(p => p.rank === 1).country}: ${edition.podium.find(p => p.rank === 1).Gold} Gold`}>
                                    <div className="podium-medal">🥇</div>
                                    <div className="podium-country">{edition.podium.find(p => p.rank === 1).country}</div>
                                    <div className="podium-score">{edition.podium.find(p => p.rank === 1).Gold} G</div>
                                  </div>
                                )}
                                {/* Rank 3 */}
                                {edition.podium.find(p => p.rank === 3) && (
                                  <div className="podium-col rank-3" title={`${edition.podium.find(p => p.rank === 3).country}: ${edition.podium.find(p => p.rank === 3).Gold} Gold`}>
                                    <div className="podium-medal">🥉</div>
                                    <div className="podium-country">{edition.podium.find(p => p.rank === 3).country}</div>
                                    <div className="podium-score">{edition.podium.find(p => p.rank === 3).Gold} G</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        ))
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Timelines Line Charts */}
                <div className="charts-grid">
                  <div className="glass-card">
                    <h3>Participating Nations Over Time</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={overallCharts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="Edition" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }}
                          />
                          <Line type="monotone" dataKey="Nations" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3>Total Events Conducted</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={overallCharts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="Edition" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }}
                          />
                          <Line type="monotone" dataKey="Events" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Athlete Participation Trends</h3>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart data={overallCharts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="Edition" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }}
                          />
                          <Line type="monotone" dataKey="Athletes" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Event Matrix Heatmap */}
                {heatmapData && (
                  <div className="glass-card">
                    <div className="flex-between">
                      <h3>Number of Events per Sport Across Editions</h3>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Event Count:</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>0</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', fontSize: '0.7rem' }}>1+</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.55)', fontSize: '0.7rem' }}>10+</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.95)', fontSize: '0.7rem' }}>25+</span>
                        </div>
                      </div>
                    </div>
                    <div className="heatmap-container">
                      <table className="heatmap-table">
                        <thead>
                          <tr>
                            <th>Sport</th>
                            {heatmapData.years.map(y => <th key={y}>{y}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {heatmapData.data.map(row => (
                            <tr key={row.sport}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', minWidth: '150px' }}>{row.sport}</td>
                              {heatmapData.years.map(y => {
                                const val = row[y] || 0;
                                return (
                                  <td key={y}>
                                    <div className={`heatmap-cell ${getCellLevel(val)}`} title={`${row.sport} in ${y}: ${val} events`}>
                                      {val > 0 ? val : ''}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Most Successful Athletes */}
                <div className="glass-card">
                  <div className="flex-between">
                    <h3>Most Decorated Athletes</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <button 
                        className="btn-glass"
                        onClick={() => exportToCSV(mostSuccessful, `decorated_athletes_${selectedSportOverall}.csv`)}
                        disabled={mostSuccessful.length === 0}
                      >
                        Export Athletes
                      </button>
                      <div className="form-group" style={{ minWidth: 250 }}>
                        <select 
                          className="custom-select"
                          value={selectedSportOverall}
                          onChange={(e) => setSelectedSportOverall(e.target.value)}
                        >
                          {filters.sports.map(sport => (
                            <option key={sport} value={sport}>
                              {sport.charAt(0).toUpperCase() + sport.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Gender</th>
                          <th>Region/Team</th>
                          <th>Sport</th>
                          <th>Medal Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mostSuccessful.map((athlete, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{athlete.Name}</td>
                            <td>{athlete.Sex === 'M' ? 'Male' : 'Female'}</td>
                            <td>{athlete.region !== 'N/A' ? athlete.region : athlete.Team}</td>
                            <td>{athlete.Sport}</td>
                            <td>
                              <span className="medal-badge medal-gold" style={{ marginRight: '6px' }}>{athlete.Medals}</span>
                              Total Medals
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: MEDAL TALLY */}
        {activeTab === 'tally' && (
          <div className="tab-pane">
            <div className="flex-between">
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-amber">
                  <Trophy size={12} />
                  <span>Official Medal Leaderboard</span>
                </div>
                <h2>Olympic Medal Standings</h2>
                <p>Explore, search, and filter medal counts from overall summer games database tallies.</p>
              </div>
              <button 
                className="btn-glass"
                onClick={() => exportToCSV(medalTally, `medal_tally_${selectedYearTally}_${selectedCountryTally}.csv`)}
                disabled={medalTally.length === 0}
              >
                Export Tally CSV
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}></div>

            <div className="filter-bar-panel">
              <div className="form-group">
                <label>Select Year</label>
                <select 
                  className="custom-select"
                  value={selectedYearTally}
                  onChange={(e) => setSelectedYearTally(e.target.value)}
                >
                  {filters.years.map(y => (
                    <option key={y} value={y}>
                      {y.charAt(0).toUpperCase() + y.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Country</label>
                <select 
                  className="custom-select"
                  value={selectedCountryTally}
                  onChange={(e) => setSelectedCountryTally(e.target.value)}
                >
                  {filters.countries.map(c => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginLeft: 'auto', minWidth: 280 }}>
                <label>Search Standings</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search country..." 
                    className="search-input"
                    value={tallySearch}
                    onChange={(e) => setTallySearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                  <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>
              {loading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Retrieving medal standings...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 75, textAlign: 'center' }}>Rank</th>
                        <th>{selectedYearTally === 'overall' && selectedCountryTally !== 'overall' ? 'Olympic Year' : 'Region / Country'}</th>
                        <th className="th-gold" style={{ textAlign: 'center', width: 105 }}>🥇 Gold</th>
                        <th className="th-silver" style={{ textAlign: 'center', width: 105 }}>🥈 Silver</th>
                        <th className="th-bronze" style={{ textAlign: 'center', width: 105 }}>🥉 Bronze</th>
                        <th className="th-total" style={{ textAlign: 'center', width: 115 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medalTally
                        .filter(item => item.region.toLowerCase().includes(tallySearch.toLowerCase()))
                        .map((row, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: 'center' }}>
                              {index === 0 ? <span className="rank-badge rank-1">1</span> :
                               index === 1 ? <span className="rank-badge rank-2">2</span> :
                               index === 2 ? <span className="rank-badge rank-3">3</span> :
                               <span className="rank-num">{index + 1}</span>}
                            </td>
                            <td style={{ fontWeight: 600 }}>{row.region}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="medal-badge medal-gold">{row.Gold}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="medal-badge medal-silver">{row.Silver}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="medal-badge medal-bronze">{row.Bronze}</span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              <span className="medal-badge medal-total">{row.total}</span>
                            </td>
                          </tr>
                        ))}
                      {medalTally.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            No medal standings found for this filter combination.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COUNTRY ANALYSIS */}
        {activeTab === 'country' && (
          <div className="tab-pane">
            <div className="flex-between">
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-emerald">
                  <Globe size={12} />
                  <span>National Olympic Profiles</span>
                </div>
                <h2>Country Performance Hub</h2>
                <p>Explore timeline trends, excels in specific sports, and view top Olympic medalists for individual nations.</p>
              </div>
              <button 
                className="btn-glass"
                onClick={() => exportToCSV(countryData ? countryData.medal_tally : [], `${selectedCountryAnalysis}_historical_medals.csv`)}
                disabled={!countryData || !countryData.medal_tally || countryData.medal_tally.length === 0}
              >
                Export Medals CSV
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}></div>

            <div className="filter-bar-panel">
              <div className="form-group" style={{ minWidth: 320 }}>
                <label>Choose Country</label>
                <select 
                  className="custom-select"
                  value={selectedCountryAnalysis}
                  onChange={(e) => setSelectedCountryAnalysis(e.target.value)}
                >
                  {filters.countries.filter(c => c !== 'overall').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>
              {countryLoading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Analyzing {selectedCountryAnalysis} history...</p>
                </div>
              ) : countryData ? (
                <div>
                  {/* Timeline Chart */}
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ color: '#34d399' }}>{selectedCountryAnalysis} Medals Over the Years</h3>
                    <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                      {countryData.medal_tally.length > 0 ? (
                        <ResponsiveContainer>
                          <AreaChart data={countryData.medal_tally}>
                            <defs>
                              <linearGradient id="colorMedal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="Year" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }} />
                            <Area type="monotone" dataKey="Medals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMedal)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          No medals won historically.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Heatmap: Sports Country Excels In */}
                  {countryData.heatmap && countryData.heatmap.data.length > 0 && (
                    <div className="glass-card" style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                      <div className="flex-between">
                        <h3>Distribution of Medals Across Sports</h3>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>0</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)', fontSize: '0.7rem' }}>1+</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.55)', fontSize: '0.7rem' }}>5+</span>
                          <span className="medal-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.95)', fontSize: '0.7rem' }}>10+</span>
                        </div>
                      </div>
                      <div className="heatmap-container" style={{ marginTop: '1rem' }}>
                        <table className="heatmap-table">
                          <thead>
                            <tr>
                              <th>Sport</th>
                              {countryData.heatmap.years.map(y => <th key={y}>{y}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {countryData.heatmap.data.map(row => (
                              <tr key={row.sport}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', minWidth: '150px' }}>{row.sport}</td>
                                {countryData.heatmap.years.map(y => {
                                  const val = row[y] || 0;
                                  return (
                                    <td key={y}>
                                      <div className={`heatmap-cell ${getCellLevel(val)}`} title={`${row.sport} in ${y}: ${val} medals`}>
                                        {val > 0 ? val : ''}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Top Athletes Grid */}
                  <div className="glass-card" style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                    <h3>Top Medalists from {selectedCountryAnalysis}</h3>
                    <div className="table-container" style={{ marginTop: '1rem' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Athlete Name</th>
                            <th>Gender</th>
                            <th>NOC</th>
                            <th>Sport</th>
                            <th>Medals Won</th>
                          </tr>
                        </thead>
                        <tbody>
                          {countryData.top_athletes.map((athlete, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{athlete.Name}</td>
                              <td>{athlete.Sex === 'M' ? 'Male' : 'Female'}</td>
                              <td>{athlete.NOC}</td>
                              <td>{athlete.Sport}</td>
                              <td>
                                <span className="medal-badge medal-gold" style={{ marginRight: '6px' }}>{athlete.Medals}</span>
                                Medals
                              </td>
                            </tr>
                          ))}
                          {countryData.top_athletes.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No medalist records available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB: COUNTRY COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="tab-pane">
            <div className="flex-between">
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-orange">
                  <Target size={12} />
                  <span>Delegation Benchmark Comparison</span>
                </div>
                <h2>Country Comparison Dashboard</h2>
                <p>Benchmark physical profiles, historical standings, and delegation metrics for two competing nations.</p>
              </div>
              <button 
                className="btn-glass"
                onClick={() => exportToCSV(comparisonData ? comparisonData.timeline : [], `${country1}_vs_${country2}_medal_comparison.csv`)}
                disabled={!comparisonData || !comparisonData.timeline || comparisonData.timeline.length === 0}
              >
                Export Comparison CSV
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}></div>

            <div className="filter-bar-panel" style={{ alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ color: '#38bdf8' }}>Country 1 (Delegation A)</label>
                <select 
                  className="custom-select"
                  value={country1}
                  onChange={(e) => setCountry1(e.target.value)}
                >
                  {filters.countries.filter(c => c !== 'overall' && c !== country2).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 900, padding: '0.4rem 0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>VS</div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ color: '#34d399' }}>Country 2 (Delegation B)</label>
                <select 
                  className="custom-select"
                  value={country2}
                  onChange={(e) => setCountry2(e.target.value)}
                >
                  {filters.countries.filter(c => c !== 'overall' && c !== country1).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>

              {comparisonLoading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Benchmarking {country1} and {country2} data...</p>
                </div>
              ) : comparisonData ? (
                <div>
                  {/* Side-by-Side Statistics Grid */}
                  <div className="compare-grid">
                    <div className="compare-country-card left" style={{ borderLeft: '4px solid #38bdf8', boxShadow: '0 10px 30px rgba(56, 189, 248, 0.15)' }}>
                      <h3 style={{ color: '#38bdf8', marginBottom: '1.5rem', fontSize: '1.4rem' }}>{comparisonData.metrics1.country || country1}</h3>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">All-Time Medals</span>
                        <span className="compare-metric-value">{comparisonData.metrics1.total || 0}</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Gold / Silver / Bronze</span>
                        <span className="compare-metric-value">
                          {comparisonData.metrics1.gold}G / {comparisonData.metrics1.silver}S / {comparisonData.metrics1.bronze}B
                        </span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Total Unique Competitors</span>
                        <span className="compare-metric-value">{comparisonData.metrics1.athletes || 0}</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Average Athlete Age</span>
                        <span className="compare-metric-value">{comparisonData.metrics1.avg_age || 'N/A'} yrs</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Average Height / Weight</span>
                        <span className="compare-metric-value">
                          {comparisonData.metrics1.avg_height || 'N/A'} cm / {comparisonData.metrics1.avg_weight || 'N/A'} kg
                        </span>
                      </div>
                    </div>

                    <div className="compare-country-card right" style={{ borderLeft: '4px solid #10b981', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)' }}>
                      <h3 style={{ color: '#34d399', marginBottom: '1.5rem', fontSize: '1.4rem' }}>{comparisonData.metrics2.country || country2}</h3>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">All-Time Medals</span>
                        <span className="compare-metric-value">{comparisonData.metrics2.total || 0}</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Gold / Silver / Bronze</span>
                        <span className="compare-metric-value">
                          {comparisonData.metrics2.gold}G / {comparisonData.metrics2.silver}S / {comparisonData.metrics2.bronze}B
                        </span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Total Unique Competitors</span>
                        <span className="compare-metric-value">{comparisonData.metrics2.athletes || 0}</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Average Athlete Age</span>
                        <span className="compare-metric-value">{comparisonData.metrics2.avg_age || 'N/A'} yrs</span>
                      </div>
                      <div className="compare-metric-row">
                        <span className="compare-metric-label">Average Height / Weight</span>
                        <span className="compare-metric-value">
                          {comparisonData.metrics2.avg_height || 'N/A'} cm / {comparisonData.metrics2.avg_weight || 'N/A'} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medal Performance Timelines */}
                  <div className="glass-card" style={{ marginTop: '2rem' }}>
                    <h3>Historical Medal Output Comparison</h3>
                    <div style={{ width: '100%', height: 350, marginTop: '1.5rem' }}>
                      {comparisonData.timeline.length > 0 ? (
                        <ResponsiveContainer>
                          <LineChart data={comparisonData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="Year" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }} />
                            <Legend />
                            <Line type="monotone" name={country1} dataKey="Country1" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" name={country2} dataKey="Country2" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          No medals won historically.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Sports Benchmarking */}
                  <div className="prediction-results-grid">
                    <div className="glass-card">
                      <h4 style={{ color: '#38bdf8', marginBottom: '1rem' }}>Top Sports for {country1}</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Sport</th>
                              <th>Medals Won</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData.sports1.map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600 }}>{row.sport}</td>
                                <td><span className="medal-badge medal-gold">{row.medals}</span></td>
                              </tr>
                            ))}
                            {comparisonData.sports1.length === 0 && (
                              <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No medal records available.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="glass-card">
                      <h4 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Top Sports for {country2}</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Sport</th>
                              <th>Medals Won</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData.sports2.map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600 }}>{row.sport}</td>
                                <td><span className="medal-badge medal-silver">{row.medals}</span></td>
                              </tr>
                            ))}
                            {comparisonData.sports2.length === 0 && (
                              <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No medal records available.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB: MEDAL PREDICTOR */}
        {activeTab === 'predictor' && (
          <div className="tab-pane">
            <div className="header">
              <div className="tab-pill-badge theme-rose">
                <Sliders size={12} />
                <span>Algorithmic Medal Projections</span>
              </div>
              <h2>LA 2028 & Future Medal Predictor</h2>
              <p>Simulate projected medal counts for upcoming Olympic Games based on historical performance, delegation momentum, and host status.</p>
            </div>

            <div className="filter-bar-panel" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid' }}>
              <div className="form-group">
                <label style={{ color: '#fb7185' }}>Select Target Country</label>
                <select 
                  className="custom-select"
                  value={predictCountry}
                  onChange={(e) => setPredictCountry(e.target.value)}
                >
                  {filters.countries.filter(c => c !== 'overall').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ color: '#38bdf8' }}>Target Edition Year</label>
                <select 
                  className="custom-select"
                  value={predictYear}
                  onChange={(e) => setPredictYear(parseInt(e.target.value))}
                >
                  <option value={2028}>Los Angeles 2028 (Summer)</option>
                  <option value={2032}>Brisbane 2032 (Summer)</option>
                </select>
              </div>

              {/* Delegation Size Adjustment Slider */}
              <div className="form-group">
                <label style={{ color: '#34d399' }}>Delegation Size: {delegationOverride || (predictData && predictData.features_used.athletes_estimate) || 50} Athletes</label>
                <input 
                  type="range" 
                  min="1" 
                  max="1000" 
                  value={delegationOverride || (predictData && predictData.features_used.athletes_estimate) || 50}
                  onChange={(e) => setDelegationOverride(parseInt(e.target.value))}
                  className="custom-range"
                />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>

              {predictLoading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Calculating projected outcomes across historical Olympic datasets...</p>
                </div>
              ) : predictData ? (
                <div>
                  {predictData.error ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      {predictData.error}
                    </div>
                  ) : (
                    <div className="prediction-results-grid">
                      {/* Big Highlights Card */}
                      <div className="glass-card prediction-highlight-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h4 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                          Predicted Total Medals
                        </h4>
                        <div className="prediction-big-badge">{predictData.total}</div>
                        <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                          Forecast Confidence: {predictData.confidence}%
                        </p>
                      </div>

                      {/* Breakdown and Features used */}
                      <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3>Medal Predictions Breakdown</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem', justifyContent: 'space-around' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div className="medal-badge medal-gold" style={{ width: 45, height: 45, fontSize: '1.2rem', marginBottom: '8px' }}>
                              {predictData.Gold}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GOLD</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div className="medal-badge medal-silver" style={{ width: 45, height: 45, fontSize: '1.2rem', marginBottom: '8px' }}>
                              {predictData.Silver}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SILVER</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div className="medal-badge medal-bronze" style={{ width: 45, height: 45, fontSize: '1.2rem', marginBottom: '8px' }}>
                              {predictData.Bronze}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BRONZE</div>
                          </div>
                        </div>

                        {/* Visual Segmented Medal Distribution Ratio Bar */}
                        {predictData.total > 0 && (
                          <div style={{ marginBottom: '1.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: 600 }}>
                              <span>Medal Composition Ratio</span>
                              <span>{predictData.total} Total Medals</span>
                            </div>
                            <div style={{
                              display: 'flex',
                              height: '10px',
                              borderRadius: '999px',
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.08)',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
                            }}>
                              <div 
                                title={`Gold: ${predictData.Gold} (${Math.round((predictData.Gold / predictData.total) * 100)}%)`}
                                style={{ 
                                  width: `${(predictData.Gold / predictData.total) * 100}%`,
                                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                                }} 
                              />
                              <div 
                                title={`Silver: ${predictData.Silver} (${Math.round((predictData.Silver / predictData.total) * 100)}%)`}
                                style={{ 
                                  width: `${(predictData.Silver / predictData.total) * 100}%`,
                                  background: 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                                  boxShadow: '0 0 10px rgba(203, 213, 225, 0.3)'
                                }} 
                              />
                              <div 
                                title={`Bronze: ${predictData.Bronze} (${Math.round((predictData.Bronze / predictData.total) * 100)}%)`}
                                style={{ 
                                  width: `${(predictData.Bronze / predictData.total) * 100}%`,
                                  background: 'linear-gradient(90deg, #c2410c, #ea580c)',
                                  boxShadow: '0 0 10px rgba(234, 88, 12, 0.4)'
                                }} 
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem' }}>
                              <span style={{ color: '#fbbf24', fontWeight: 600 }}>● {Math.round((predictData.Gold / predictData.total) * 100) || 0}% Gold</span>
                              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>● {Math.round((predictData.Silver / predictData.total) * 100) || 0}% Silver</span>
                              <span style={{ color: '#ea580c', fontWeight: 600 }}>● {Math.round((predictData.Bronze / predictData.total) * 100) || 0}% Bronze</span>
                            </div>
                          </div>
                        )}

                        <h4 style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>Key Factors Influencing Projections</h4>
                        <ul className="prediction-details-list">
                          <li className="prediction-detail-item">
                            <span>Last Edition Medals ({predictYear - 4 === 2024 ? 2024 : predictYear - 8})</span>
                            <span>{predictData.features_used.prev_medals} medals</span>
                          </li>
                          <li className="prediction-detail-item">
                            <span>Estimated Athlete Delegation Size</span>
                            <span>{predictData.features_used.athletes_estimate} athletes</span>
                          </li>
                          <li className="prediction-detail-item">
                            <span>Host Advantage Multiplier</span>
                            <span>{predictData.features_used.is_host ? "Active (Host Country)" : "Inactive"}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB: LEGENDARY RECORDS */}
        {activeTab === 'records' && (
          <div className="tab-pane">
            <div className="flex-between" style={{ alignItems: 'flex-end', marginBottom: '2rem' }}>
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-amber">
                  <Award size={12} />
                  <span>Hall of Fame & Historic Bests</span>
                </div>
                <h2>Legendary Olympic Records</h2>
                <p>Explore some of the most iconic, record-shattering athletic performances in Summer Olympics history.</p>
              </div>
              
              {/* Carousel Controls positioned in header row */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="carousel-btn"
                  onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                  disabled={carouselIndex === 0}
                  style={{ width: 40, height: 40 }}
                >
                  &larr;
                </button>
                <button 
                  className="carousel-btn"
                  onClick={() => setCarouselIndex(prev => Math.min(OLYMPIC_RECORDS.length - 3, prev + 1))}
                  disabled={carouselIndex >= OLYMPIC_RECORDS.length - 3}
                  style={{ width: 40, height: 40 }}
                >
                  &rarr;
                </button>
              </div>
            </div>

            <div className="carousel-viewport">
              <div className="carousel-track" style={{ transform: `translateX(-${carouselIndex * 33.333}%)` }}>
                {OLYMPIC_RECORDS.map((rec, idx) => (
                  <div key={idx} className="carousel-card">
                    {/* Visual Card Header Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div className="carousel-card-subtitle">{rec.subtitle}</div>
                      <div style={{ padding: '6px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <Trophy size={16} color="#fbbf24" />
                      </div>
                    </div>

                    <div className="carousel-card-title">{rec.title}</div>
                    
                    <div style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(245, 158, 11, 0.3)', 
                      borderRadius: '8px', 
                      padding: '0.5rem 0.75rem', 
                      color: '#fbbf24', 
                      fontWeight: 800, 
                      fontSize: '0.9rem', 
                      display: 'inline-block',
                      margin: '0.5rem 0 1.25rem 0' 
                    }}>
                      ⭐ {rec.highlight}
                    </div>

                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', margin: '0.5rem 0 1rem 0' }}></div>
                    
                    <p className="carousel-card-text">{rec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ATHLETE ANALYSIS */}
        {activeTab === 'athlete' && (
          <div className="tab-pane">
            <div className="flex-between">
              <div className="header" style={{ marginBottom: 0 }}>
                <div className="tab-pill-badge theme-violet">
                  <Users size={12} />
                  <span>Biometric & Demographic Analysis</span>
                </div>
                <h2>Athlete Performance Profiles</h2>
                <p>Deep dive into body metrics (height vs weight correlations), gender timelines, and age distributions of medalists.</p>
              </div>
              <button 
                className="btn-glass"
                onClick={() => exportToCSV(athleteData ? athleteData.men_vs_women : [], `athlete_gender_representation_${selectedSportAthlete}.csv`)}
                disabled={!athleteData || !athleteData.men_vs_women || athleteData.men_vs_women.length === 0}
              >
                Export Gender CSV
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}></div>

            <div className="filter-bar-panel">
              <div className="form-group" style={{ minWidth: 320 }}>
                <label style={{ color: '#c084fc' }}>Filter by Sport</label>
                <select 
                  className="custom-select"
                  value={selectedSportAthlete}
                  onChange={(e) => setSelectedSportAthlete(e.target.value)}
                >
                  {filters.sports.map(sport => (
                    <option key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>
              {athleteLoading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Aggregating physical profile distributions...</p>
                </div>
              ) : athleteData ? (
                <div className="charts-grid">
                  {/* Age Distribution */}
                  <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Age Distribution of Medalists vs. Competitors</h3>
                    <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
                      <ResponsiveContainer>
                        <AreaChart data={athleteData.age_distribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="bin" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }} />
                          <Legend />
                          <Area type="monotone" dataKey="Overall" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.05} />
                          <Area type="monotone" dataKey="Gold" stroke="#fcd34d" fill="#fcd34d" fillOpacity={0.1} />
                          <Area type="monotone" dataKey="Silver" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.1} />
                          <Area type="monotone" dataKey="Bronze" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Height vs Weight Scatter Plot */}
                  <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Physical Profile: Height vs. Weight ({selectedSportAthlete})</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      Displays physical dimensions (Height in cm, Weight in kg) sampled to 1,000 athletes to show correlation.
                    </p>
                    <div style={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" dataKey="Weight" name="Weight" unit="kg" stroke="#9ca3af" domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey="Height" name="Height" unit="cm" stroke="#9ca3af" domain={['auto', 'auto']} />
                          <ZAxis type="category" dataKey="Medal" name="Medal" />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }}
                            formatter={(value, name, props) => {
                              if (name === "Medal") return [value, "Medal Result"];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Scatter 
                            name="Athletes" 
                            data={athleteData.height_vs_weight} 
                            fill="#8b5cf6"
                          >
                            {athleteData.height_vs_weight.map((entry, index) => {
                              let cellColor = '#6b7280'; // No Medal (gray)
                              if (entry.Medal === 'Gold') cellColor = '#fbbf24'; // Gold
                              if (entry.Medal === 'Silver') cellColor = '#cbd5e1'; // Silver
                              if (entry.Medal === 'Bronze') cellColor = '#b45309'; // Bronze
                              return <Cell key={`cell-${index}`} fill={cellColor} opacity={entry.Medal === 'No Medal' ? 0.3 : 0.9} />;
                            })}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gender Split AreaChart */}
                  <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Gender Representation Over Editions</h3>
                    <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
                      <ResponsiveContainer>
                        <AreaChart data={athleteData.men_vs_women}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="Year" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f3f4f6' }} />
                          <Legend />
                          <Area type="monotone" dataKey="Male" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                          <Area type="monotone" dataKey="Female" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Oracle Widget */}
      <div className="chat-widget-container">
        {chatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="stat-card-icon-wrap" style={{ width: 32, height: 32, margin: 0, borderRadius: 8 }}>
                  <Sparkles size={16} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>Olympics Oracle</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                    <span className="status-dot-pulse" style={{ width: 6, height: 6 }}></span>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Assistant Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={clearChat}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                  color: '#f87171', 
                  fontSize: '0.72rem', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </div>
            
            {/* Messages body */}
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}`}>
                  {msg.text.split('\n').map((line, i) => {
                    // Simple bold text replacement parser for styling chatbot highlights
                    let parsed = line;
                    const bolds = line.match(/\*\*(.*?)\*\*/g);
                    if (bolds) {
                      bolds.forEach(match => {
                        const word = match.substring(2, match.length - 2);
                        parsed = parsed.replace(match, `<strong>${word}</strong>`);
                      });
                    }
                    return <div key={i} dangerouslySetInnerHTML={{ __html: parsed }} />;
                  })}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble oracle">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                    <span style={{ fontSize: '0.85rem' }}>Searching historical vault records...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef}></div>
            </div>

            {/* Quick chips suggestions */}
            <div className="chat-suggestions">
              <div className="chat-suggestion-chip" onClick={() => setChatInput("Predict medals for India in 2028")}>📈 Predict India 2028</div>
              <div className="chat-suggestion-chip" onClick={() => setChatInput("Who is the most decorated swimmer?")}>🏊 Top Swimmer</div>
              <div className="chat-suggestion-chip" onClick={() => setChatInput("How many medals did China win in 2008?")}>🇨🇳 China 2008</div>
              <div className="chat-suggestion-chip" onClick={() => setChatInput("What was the average age of competitors in 2016?")}>📊 Avg Age 2016</div>
            </div>

            {/* Chat Input form */}
            <form className="chat-input-area" onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Ask e.g. USA swimmers height in 2016..."
                className="chat-input-text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn-send" title="Send Query">
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* Toggle Button */}
        <div className="chat-button" onClick={() => setChatOpen(!chatOpen)} title="Olympics Oracle Chatbot">
          <Sparkles size={24} color="#ffffff" />
        </div>
      </div>

    </div>
  );
}

export default App;
