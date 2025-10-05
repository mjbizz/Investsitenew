import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BuyingPower.css';

const BuyingPower = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    annualIncome: '',
    monthlyDebts: '',
    downPayment: '',
    creditScore: '700-749',
    interestRate: '7.0',
    loanTerm: '30'
  });
  const [results, setResults] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBuyingPower = () => {
    const income = parseFloat(formData.annualIncome) || 0;
    const debts = parseFloat(formData.monthlyDebts) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const rate = parseFloat(formData.interestRate) / 100 / 12;
    const loanTermYears = parseFloat(formData.loanTerm) || 30;

    // DTI calculation (28% front-end ratio)
    const maxMonthlyPayment = (income / 12) * 0.28 - debts;
    
    // Loan amount calculation with variable loan term
    const months = loanTermYears * 12;
    const loanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + rate, -months)) / rate);
    
    const maxPurchasePrice = loanAmount + downPayment;
    const monthlyPayment = maxMonthlyPayment;

    // Calculate total interest paid over loan term
    const totalPayments = monthlyPayment * months;
    const totalInterest = totalPayments - loanAmount;

    setResults({
      maxPurchasePrice: Math.max(0, maxPurchasePrice),
      loanAmount: Math.max(0, loanAmount),
      monthlyPayment: Math.max(0, monthlyPayment),
      downPaymentPercent: downPayment > 0 ? (downPayment / maxPurchasePrice * 100) : 0,
      totalInterest: Math.max(0, totalInterest),
      totalPayments: Math.max(0, totalPayments),
      loanTermYears: loanTermYears
    });

    // Scroll to results section after a short delay to allow for rendering
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="buying-power">
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
        <div className="main-content">
          <div className="hero-section">
            <h1>Your Estimated Purchase Power</h1>
            <p>Calculate your maximum home buying capacity based on your financial profile</p>
          </div>

          <div className="calculator-container">
          <div className="form-section">
            <h2>Financial Information</h2>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Annual Gross Income</label>
                <input
                  type="number"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  placeholder="$75,000"
                  className="financial-input"
                />
              </div>

              <div className="input-group">
                <label>Monthly Debt Payments</label>
                <input
                  type="number"
                  name="monthlyDebts"
                  value={formData.monthlyDebts}
                  onChange={handleInputChange}
                  placeholder="$500"
                  className="financial-input"
                />
              </div>

              <div className="input-group">
                <label>Available Down Payment</label>
                <input
                  type="number"
                  name="downPayment"
                  value={formData.downPayment}
                  onChange={handleInputChange}
                  placeholder="$50,000"
                  className="financial-input"
                />
              </div>

              <div className="input-group">
                <label>Credit Score Range</label>
                <select
                  name="creditScore"
                  value={formData.creditScore}
                  onChange={handleInputChange}
                  className="financial-select"
                >
                  <option value="800+">800+ (Excellent)</option>
                  <option value="750-799">750-799 (Very Good)</option>
                  <option value="700-749">700-749 (Good)</option>
                  <option value="650-699">650-699 (Fair)</option>
                  <option value="600-649">600-649 (Poor)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  className="financial-input"
                />
              </div>

              <div className="input-group">
                <label>Loan Term (Years)</label>
                <select
                  name="loanTerm"
                  value={formData.loanTerm}
                  onChange={handleInputChange}
                  className="financial-select"
                >
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                  <option value="25">25 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>

            <button className="calculate-btn" onClick={calculateBuyingPower}>
              Calculate Buying Power
            </button>
          </div>

          {results && (
            <div className="results-section">
              <h2>Your Buying Power Results</h2>
              
              <div className="result-card main-result">
                <div className="result-label">Maximum Purchase Price</div>
                <div className="result-value primary">
                  {formatCurrency(results.maxPurchasePrice)}
                </div>
              </div>

              <div className="results-grid">
                <div className="result-card">
                  <div className="result-label">Loan Amount</div>
                  <div className="result-value">
                    {formatCurrency(results.loanAmount)}
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-label">Monthly Payment</div>
                  <div className="result-value">
                    {formatCurrency(results.monthlyPayment)}
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-label">Down Payment</div>
                  <div className="result-value">
                    {formatCurrency(parseFloat(formData.downPayment) || 0)}
                    <span className="percentage">
                      ({results.downPaymentPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-label">Loan Term</div>
                  <div className="result-value">
                    {results.loanTermYears} years
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-label">Total Interest</div>
                  <div className="result-value">
                    {formatCurrency(results.totalInterest)}
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-label">Total Payments</div>
                  <div className="result-value">
                    {formatCurrency(results.totalPayments)}
                  </div>
                </div>
              </div>

              <div className="next-steps">
                <h3>Ready to find properties?</h3>
                <button 
                  className="next-btn"
                  onClick={() => navigate('/property-search')}
                >
                  Search Properties →
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyingPower;
