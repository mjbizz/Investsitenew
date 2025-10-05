import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InvestmentTypeNew.css';

const InvestmentTypeNew = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    investmentGoal: '',
    investmentDuration: '',
    priceRange: '',
    capitalUpfront: '',
    cashOrLoan: '',
    experienceLevel: '',
    riskTolerance: ''
  });

  const [showResults, setShowResults] = useState(false);

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResults(true);
    
    // Scroll to results after a short delay
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const getRecommendations = () => {
    const { investmentGoal, experienceLevel, riskTolerance, priceRange, capitalUpfront, cashOrLoan, investmentDuration } = formData;
    
    let recommendations = [];
    
    // Algorithm to determine best investment options based on user answers
    
    // Short-term rental properties
    if ((investmentGoal === 'passive-income' || investmentGoal === 'wealth-building') && 
        (experienceLevel === 'beginner' || experienceLevel === 'intermediate') &&
        (riskTolerance === 'low' || riskTolerance === 'medium')) {
      recommendations.push({
        type: 'Short-Term Rental Properties',
        description: 'Single-family homes or condos for rental income (1-3 years)',
        benefits: ['Quick cash flow', 'Lower commitment', 'Learning opportunity'],
        riskLevel: 'Low to Medium',
        timeCommitment: 'Medium',
        score: calculateScore('short-term', formData)
      });
    }
    
    // Long-term rental properties
    if ((investmentGoal === 'passive-income' || investmentGoal === 'wealth-building' || investmentGoal === 'tax-benefits') &&
        (investmentDuration === 'long-term') &&
        (priceRange !== 'under-100k')) {
      recommendations.push({
        type: 'Long-Term Rental Properties',
        description: 'Buy and hold properties for sustained rental income (5+ years)',
        benefits: ['Steady cash flow', 'Long-term appreciation', 'Tax advantages', 'Equity building'],
        riskLevel: 'Medium',
        timeCommitment: 'Low to Medium',
        score: calculateScore('long-term', formData)
      });
    }
    
    // Fix and Flip
    if ((investmentGoal === 'appreciation' || investmentGoal === 'wealth-building') &&
        (experienceLevel === 'intermediate' || experienceLevel === 'experienced') &&
        (riskTolerance === 'medium' || riskTolerance === 'high') &&
        (capitalUpfront !== 'under-25k')) {
      recommendations.push({
        type: 'Fix and Flip Properties',
        description: 'Purchase, renovate, and sell properties for quick profits',
        benefits: ['High profit potential', 'Quick returns (6-12 months)', 'Active involvement', 'Market knowledge gain'],
        riskLevel: 'High',
        timeCommitment: 'High',
        score: calculateScore('flipping', formData)
      });
    }
    
    // Commercial Real Estate
    if ((investmentGoal === 'passive-income' || investmentGoal === 'diversification' || investmentGoal === 'wealth-building') &&
        (experienceLevel === 'experienced' || experienceLevel === 'expert') &&
        (priceRange === 'over-1m' || capitalUpfront === 'over-250k')) {
      recommendations.push({
        type: 'Commercial Real Estate',
        description: 'Office buildings, retail spaces, or industrial properties',
        benefits: ['Higher returns', 'Professional tenants', 'Longer leases', 'Portfolio diversification'],
        riskLevel: 'Medium to High',
        timeCommitment: 'Medium',
        score: calculateScore('commercial', formData)
      });
    }
    
    // Sort by score (highest first) and return top 3
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  };
  
  const calculateScore = (investmentType, data) => {
    let score = 0;
    
    // Score based on investment goal alignment
    if (investmentType === 'short-term' && (data.investmentGoal === 'passive-income' || data.investmentDuration === 'short-term')) score += 30;
    if (investmentType === 'long-term' && (data.investmentGoal === 'passive-income' || data.investmentDuration === 'long-term')) score += 30;
    if (investmentType === 'flipping' && data.investmentGoal === 'appreciation') score += 30;
    if (investmentType === 'commercial' && (data.investmentGoal === 'diversification' || data.investmentGoal === 'wealth-building')) score += 30;
    
    // Score based on experience level
    if (investmentType === 'short-term' && (data.experienceLevel === 'beginner' || data.experienceLevel === 'intermediate')) score += 20;
    if (investmentType === 'long-term' && data.experienceLevel !== 'beginner') score += 20;
    if (investmentType === 'flipping' && (data.experienceLevel === 'intermediate' || data.experienceLevel === 'experienced')) score += 20;
    if (investmentType === 'commercial' && (data.experienceLevel === 'experienced' || data.experienceLevel === 'expert')) score += 20;
    
    // Score based on risk tolerance
    if (investmentType === 'short-term' && (data.riskTolerance === 'low' || data.riskTolerance === 'medium')) score += 15;
    if (investmentType === 'long-term' && data.riskTolerance === 'medium') score += 15;
    if (investmentType === 'flipping' && data.riskTolerance === 'high') score += 15;
    if (investmentType === 'commercial' && (data.riskTolerance === 'medium' || data.riskTolerance === 'high')) score += 15;
    
    // Score based on capital availability
    if (investmentType === 'commercial' && (data.capitalUpfront === 'over-250k' || data.priceRange === 'over-1m')) score += 25;
    if (investmentType === 'flipping' && data.capitalUpfront !== 'under-25k') score += 15;
    
    return score;
  };

  return (
    <div className="investment-type-new">
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
          <h1>Plan Your Real Estate Investment</h1>
          <p>Find the perfect investment strategy tailored to your goals and experience</p>
        </div>


        <div className="form-container">
          <div className="form-header">
            <h2>Find the Right Investment</h2>
          </div>

          <form onSubmit={handleSubmit} className="investment-form">
            <div className="dropdown-field">
              <label>Investment Goal</label>
              <select 
                value={formData.investmentGoal}
                onChange={(e) => handleSelectChange('investmentGoal', e.target.value)}
                required
              >
                <option value="">Select your primary goal</option>
                <option value="passive-income">Generate Passive Income</option>
                <option value="appreciation">Long-term Appreciation</option>
                <option value="diversification">Portfolio Diversification</option>
                <option value="tax-benefits">Tax Benefits</option>
                <option value="wealth-building">Wealth Building</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Investment Duration</label>
              <select 
                value={formData.investmentDuration}
                onChange={(e) => handleSelectChange('investmentDuration', e.target.value)}
                required
              >
                <option value="">How long do you plan to invest?</option>
                <option value="short-term">Short-term (1-3 years)</option>
                <option value="medium-term">Medium-term (3-7 years)</option>
                <option value="long-term">Long-term (7+ years)</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Price Range</label>
              <select 
                value={formData.priceRange}
                onChange={(e) => handleSelectChange('priceRange', e.target.value)}
                required
              >
                <option value="">What's your budget range?</option>
                <option value="under-100k">Under $100,000</option>
                <option value="100k-250k">$100,000 - $250,000</option>
                <option value="250k-500k">$250,000 - $500,000</option>
                <option value="500k-1m">$500,000 - $1,000,000</option>
                <option value="over-1m">Over $1,000,000</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Capital Upfront</label>
              <select 
                value={formData.capitalUpfront}
                onChange={(e) => handleSelectChange('capitalUpfront', e.target.value)}
                required
              >
                <option value="">How much can you invest upfront?</option>
                <option value="under-25k">Under $25,000</option>
                <option value="25k-50k">$25,000 - $50,000</option>
                <option value="50k-100k">$50,000 - $100,000</option>
                <option value="100k-250k">$100,000 - $250,000</option>
                <option value="over-250k">Over $250,000</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Cash or Loan?</label>
              <select 
                value={formData.cashOrLoan}
                onChange={(e) => handleSelectChange('cashOrLoan', e.target.value)}
                required
              >
                <option value="">How will you finance the investment?</option>
                <option value="all-cash">All Cash</option>
                <option value="conventional-loan">Conventional Loan</option>
                <option value="hard-money">Hard Money Loan</option>
                <option value="private-lender">Private Lender</option>
                <option value="partnership">Partnership/Joint Venture</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Experience Level</label>
              <select 
                value={formData.experienceLevel}
                onChange={(e) => handleSelectChange('experienceLevel', e.target.value)}
                required
              >
                <option value="">What's your experience level?</option>
                <option value="beginner">Beginner (First investment)</option>
                <option value="intermediate">Intermediate (2-5 properties)</option>
                <option value="experienced">Experienced (5+ properties)</option>
                <option value="expert">Expert/Professional Investor</option>
              </select>
            </div>

            <div className="dropdown-field">
              <label>Risk Tolerance</label>
              <select 
                value={formData.riskTolerance}
                onChange={(e) => handleSelectChange('riskTolerance', e.target.value)}
                required
              >
                <option value="">How much risk are you comfortable with?</option>
                <option value="low">Low Risk (Stable, predictable returns)</option>
                <option value="medium">Medium Risk (Balanced approach)</option>
                <option value="high">High Risk (Maximum growth potential)</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">
              Get My Investment Recommendation
            </button>
          </form>
        </div>

        {showResults && (
          <div className="results-section">
            <div className="recommendation-card">
              <h2>Your Best Investment Options</h2>
              <p className="results-intro">Based on your preferences, here are the top investment strategies recommended for you:</p>
              
              {(() => {
                const recommendations = getRecommendations();
                
                if (recommendations.length === 0) {
                  return (
                    <div className="no-results">
                      <h3>No Perfect Match Found</h3>
                      <p>Based on your current preferences, we couldn't find ideal investment options. Consider adjusting your criteria or consulting with a financial advisor.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="recommendations-list">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className={`recommendation-item ${index === 0 ? 'top-choice' : ''}`}>
                        {index === 0 && <div className="best-match-badge">Best Match</div>}
                        
                        <div className="recommendation-header">
                          <h3>{recommendation.type}</h3>
                          <div className="match-score">{Math.round(recommendation.score)}% Match</div>
                        </div>
                        
                        <p className="recommendation-description">{recommendation.description}</p>

                        <div className="details-grid">
                          <div className="detail-item">
                            <h4>Key Benefits</h4>
                            <ul>
                              {recommendation.benefits.map((benefit, benefitIndex) => (
                                <li key={benefitIndex}>{benefit}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="detail-item">
                            <h4>Risk Level</h4>
                            <span className={`risk-badge ${recommendation.riskLevel.toLowerCase().replace(/\s+/g, '-')}`}>
                              {recommendation.riskLevel}
                            </span>
                          </div>

                          <div className="detail-item">
                            <h4>Time Commitment</h4>
                            <span className="time-badge">{recommendation.timeCommitment}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="next-steps">
                <h4>Ready to Get Started?</h4>
                <div className="action-buttons">
                  <button 
                    className="action-btn primary"
                    onClick={() => navigate('/buying-power')}
                  >
                    Calculate Buying Power
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => navigate('/property-search')}
                  >
                    Find Properties
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => navigate('/roi-calculator')}
                  >
                    Calculate ROI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentTypeNew;
