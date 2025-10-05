import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InvestmentTypes.css';

const InvestmentTypes = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);

  const investmentTypes = [
    {
      id: 'real-estate',
      title: 'Real Estate Investment',
      subtitle: 'Property & Land Investments',
      description: 'Build wealth through rental properties, fix-and-flip projects, and real estate appreciation.',
      icon: '🏠',
      features: [
        'Rental Income Generation',
        'Property Appreciation',
        'Tax Benefits & Deductions',
        'Portfolio Diversification',
        'Inflation Hedge'
      ],
      riskLevel: 'Medium',
      minInvestment: '$50,000+',
      timeHorizon: '5-30 years',
      expectedReturn: '8-12% annually',
      available: true
    },
    {
      id: 'algorithmic-trading',
      title: 'Algorithmic Trading',
      subtitle: 'Automated Stock Trading',
      description: 'Leverage advanced algorithms and AI to execute high-frequency trading strategies.',
      icon: '📈',
      features: [
        'Automated Trading Systems',
        'AI-Powered Decisions',
        'Risk Management Protocols',
        'Market Analysis Tools',
        '24/7 Trading Capability'
      ],
      riskLevel: 'High',
      minInvestment: '$10,000+',
      timeHorizon: '1-5 years',
      expectedReturn: '15-25% annually',
      available: false,
      comingSoon: true
    },
    {
      id: 'reits',
      title: 'REITs Investment',
      subtitle: 'Real Estate Investment Trusts',
      description: 'Invest in real estate without direct property ownership through publicly traded REITs.',
      icon: '🏢',
      features: [
        'Liquid Real Estate Exposure',
        'Professional Management',
        'Dividend Income',
        'Lower Entry Barrier',
        'Diversified Portfolio'
      ],
      riskLevel: 'Medium-Low',
      minInvestment: '$1,000+',
      timeHorizon: '3-10 years',
      expectedReturn: '6-10% annually',
      available: true
    },
    {
      id: 'fix-flip',
      title: 'Fix & Flip',
      subtitle: 'Property Renovation Projects',
      description: 'Purchase undervalued properties, renovate them, and sell for profit.',
      icon: '🔨',
      features: [
        'Short-term High Returns',
        'Active Investment Strategy',
        'Market Timing Opportunities',
        'Renovation Expertise Required',
        'Local Market Focus'
      ],
      riskLevel: 'High',
      minInvestment: '$75,000+',
      timeHorizon: '6-18 months',
      expectedReturn: '20-40% per project',
      available: true
    }
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type.id);
    
    // Add selection animation
    const card = document.querySelector(`[data-type="${type.id}"]`);
    if (card) {
      card.classList.add('selected');
    }
  };

  const proceedWithInvestment = () => {
    if (!selectedType) return;
    
    const type = investmentTypes.find(t => t.id === selectedType);
    
    if (type.id === 'real-estate') {
      // Navigate to the existing investment finder for real estate
      navigate('/investment-finder');
    } else if (type.available) {
      // For other available types, could navigate to specific tools
      alert(`🚀 Proceeding with ${type.title}...`);
    } else {
      alert(`⏳ ${type.title} is coming soon!`);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return '#00ff9d';
      case 'Medium-Low': return '#0099ff';
      case 'Medium': return '#9900ff';
      case 'High': return '#ff6b6b';
      default: return '#ffffff';
    }
  };

  return (
    <div className="investment-types">
      <div className="grid-bg"></div>
      
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <header>
        <nav>
          <div className="logo" onClick={() => navigate('/')}>Proper Invest Model</div>
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </nav>
      </header>

      <div className="content-container">
        <div className="hero-section">
          <h1>Choose Your Investment Strategy</h1>
          <p>Select the investment type that aligns with your goals, risk tolerance, and timeline</p>
        </div>

        <div className="types-grid">
          {investmentTypes.map(type => (
            <div 
              key={type.id}
              className={`type-card ${selectedType === type.id ? 'selected' : ''} ${!type.available ? 'coming-soon' : ''}`}
              data-type={type.id}
              onClick={() => type.available && handleTypeSelect(type)}
            >
              {type.comingSoon && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
              
              <div className="type-header">
                <div className="type-icon">{type.icon}</div>
                <div className="type-info">
                  <h3>{type.title}</h3>
                  <p className="type-subtitle">{type.subtitle}</p>
                </div>
              </div>

              <div className="type-description">
                {type.description}
              </div>

              <div className="type-metrics">
                <div className="metric">
                  <span className="metric-label">Risk Level</span>
                  <span 
                    className="metric-value risk-badge"
                    style={{ color: getRiskColor(type.riskLevel) }}
                  >
                    {type.riskLevel}
                  </span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Min Investment</span>
                  <span className="metric-value">{type.minInvestment}</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Time Horizon</span>
                  <span className="metric-value">{type.timeHorizon}</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Expected Return</span>
                  <span className="metric-value return">{type.expectedReturn}</span>
                </div>
              </div>

              <div className="type-features">
                <h4>Key Features:</h4>
                <ul>
                  {type.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              {type.available && (
                <div className="selection-indicator">
                  {selectedType === type.id ? '✓ Selected' : 'Click to Select'}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedType && (
          <div className="action-section">
            <div className="selected-summary">
              <h3>Selected Investment Type:</h3>
              <p>{investmentTypes.find(t => t.id === selectedType)?.title}</p>
            </div>
            
            <button 
              className="proceed-btn"
              onClick={proceedWithInvestment}
            >
              Proceed with Investment Analysis →
            </button>
          </div>
        )}

        <div className="comparison-section">
          <h2>Investment Comparison</h2>
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="header-cell">Investment Type</div>
              <div className="header-cell">Risk Level</div>
              <div className="header-cell">Min Investment</div>
              <div className="header-cell">Expected Return</div>
              <div className="header-cell">Time Horizon</div>
            </div>
            
            {investmentTypes.map(type => (
              <div key={type.id} className="comparison-row">
                <div className="cell">
                  <span className="cell-icon">{type.icon}</span>
                  {type.title}
                </div>
                <div className="cell">
                  <span 
                    className="risk-indicator"
                    style={{ backgroundColor: getRiskColor(type.riskLevel) }}
                  ></span>
                  {type.riskLevel}
                </div>
                <div className="cell">{type.minInvestment}</div>
                <div className="cell return-cell">{type.expectedReturn}</div>
                <div className="cell">{type.timeHorizon}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTypes;
