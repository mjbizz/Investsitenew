import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ROICalculator.css';

const ROICalculator = () => {
  const navigate = useNavigate();
  const [investmentType, setInvestmentType] = useState('');
  const [formData, setFormData] = useState({
    purchasePrice: '',
    downPayment: '',
    monthlyRent: '',
    monthlyExpenses: '',
    propertyTaxes: '',
    insurance: '',
    maintenance: '',
    vacancy: '5',
    appreciationRate: '3',
    holdingPeriod: '5',
    // Fix and Flip specific fields
    rehabCost: '',
    sellingPrice: '',
    holdingTime: '6',
    // Commercial specific fields
    squareFootage: '',
    pricePerSqFt: '',
    netOperatingIncome: '',
    // REIT specific fields
    sharePrice: '',
    numberOfShares: '',
    annualDividend: '',
    // Multi-family specific fields
    numberOfUnits: '',
    averageRent: '',
    occupancyRate: '95'
  });
  const [results, setResults] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInvestmentTypeChange = (e) => {
    setInvestmentType(e.target.value);
    setResults(null); // Clear results when investment type changes
  };

  const getFormFields = () => {
    switch (investmentType) {
      case 'short-term':
        return [
          { name: 'purchasePrice', label: 'Purchase Price', placeholder: '$250,000', type: 'number' },
          { name: 'downPayment', label: 'Down Payment', placeholder: '$50,000', type: 'number' },
          { name: 'monthlyRent', label: 'Monthly Rent', placeholder: '$2,200', type: 'number' },
          { name: 'monthlyExpenses', label: 'Monthly Expenses', placeholder: '$400', type: 'number' },
          { name: 'propertyTaxes', label: 'Property Taxes (Monthly)', placeholder: '$200', type: 'number' },
          { name: 'insurance', label: 'Insurance (Monthly)', placeholder: '$100', type: 'number' },
          { name: 'maintenance', label: 'Maintenance (Monthly)', placeholder: '$150', type: 'number' },
          { name: 'vacancy', label: 'Vacancy Rate (%)', placeholder: '8', type: 'number', step: '0.1' },
          { name: 'appreciationRate', label: 'Annual Appreciation (%)', placeholder: '4', type: 'number', step: '0.1' },
          { name: 'holdingPeriod', label: 'Holding Period (Years)', placeholder: '2', type: 'number' }
        ];
      
      case 'long-term':
        return [
          { name: 'purchasePrice', label: 'Purchase Price', placeholder: '$350,000', type: 'number' },
          { name: 'downPayment', label: 'Down Payment', placeholder: '$70,000', type: 'number' },
          { name: 'monthlyRent', label: 'Monthly Rent', placeholder: '$2,800', type: 'number' },
          { name: 'monthlyExpenses', label: 'Monthly Expenses', placeholder: '$350', type: 'number' },
          { name: 'propertyTaxes', label: 'Property Taxes (Monthly)', placeholder: '$280', type: 'number' },
          { name: 'insurance', label: 'Insurance (Monthly)', placeholder: '$120', type: 'number' },
          { name: 'maintenance', label: 'Maintenance (Monthly)', placeholder: '$200', type: 'number' },
          { name: 'vacancy', label: 'Vacancy Rate (%)', placeholder: '5', type: 'number', step: '0.1' },
          { name: 'appreciationRate', label: 'Annual Appreciation (%)', placeholder: '3', type: 'number', step: '0.1' },
          { name: 'holdingPeriod', label: 'Holding Period (Years)', placeholder: '10', type: 'number' }
        ];
      
      case 'flipping':
        return [
          { name: 'purchasePrice', label: 'Purchase Price', placeholder: '$180,000', type: 'number' },
          { name: 'rehabCost', label: 'Rehab/Renovation Cost', placeholder: '$45,000', type: 'number' },
          { name: 'sellingPrice', label: 'Expected Selling Price', placeholder: '$280,000', type: 'number' },
          { name: 'holdingTime', label: 'Holding Time (Months)', placeholder: '6', type: 'number' },
          { name: 'monthlyExpenses', label: 'Monthly Holding Costs', placeholder: '$800', type: 'number' },
          { name: 'propertyTaxes', label: 'Property Taxes (Monthly)', placeholder: '$150', type: 'number' },
          { name: 'insurance', label: 'Insurance (Monthly)', placeholder: '$80', type: 'number' }
        ];
      
      case 'commercial':
        return [
          { name: 'purchasePrice', label: 'Purchase Price', placeholder: '$1,200,000', type: 'number' },
          { name: 'downPayment', label: 'Down Payment', placeholder: '$300,000', type: 'number' },
          { name: 'squareFootage', label: 'Square Footage', placeholder: '8,000', type: 'number' },
          { name: 'pricePerSqFt', label: 'Price per Sq Ft', placeholder: '$150', type: 'number' },
          { name: 'netOperatingIncome', label: 'Annual NOI', placeholder: '$96,000', type: 'number' },
          { name: 'appreciationRate', label: 'Annual Appreciation (%)', placeholder: '2.5', type: 'number', step: '0.1' },
          { name: 'holdingPeriod', label: 'Holding Period (Years)', placeholder: '7', type: 'number' }
        ];
      
      default:
        return [];
    }
  };

  const calculateROI = () => {
    if (!investmentType) {
      alert('Please select an investment type first');
      return;
    }

    let results = {};

    switch (investmentType) {
      case 'short-term':
        results = calculateShortTermROI();
        break;
      case 'long-term':
        results = calculateLongTermROI();
        break;
      case 'flipping':
        results = calculateFlippingROI();
        break;
      case 'commercial':
        results = calculateCommercialROI();
        break;
      default:
        return;
    }

    setResults(results);
    
    // Scroll to results
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

  const calculateShortTermROI = () => {
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const monthlyRent = parseFloat(formData.monthlyRent) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const propertyTaxes = parseFloat(formData.propertyTaxes) || 0;
    const insurance = parseFloat(formData.insurance) || 0;
    const maintenance = parseFloat(formData.maintenance) || 0;
    const vacancyRate = parseFloat(formData.vacancy) / 100;
    const appreciationRate = parseFloat(formData.appreciationRate) / 100;
    const holdingPeriod = parseFloat(formData.holdingPeriod) || 1;

    const annualRent = monthlyRent * 12;
    const effectiveRent = annualRent * (1 - vacancyRate);
    const annualExpenses = (monthlyExpenses + propertyTaxes + insurance + maintenance) * 12;
    const netOperatingIncome = effectiveRent - annualExpenses;

    const loanAmount = purchasePrice - downPayment;
    const monthlyInterestRate = 0.07 / 12;
    const numberOfPayments = 30 * 12;
    const monthlyMortgage = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    const annualMortgage = monthlyMortgage * 12;

    const annualCashFlow = netOperatingIncome - annualMortgage;
    const totalCashInvested = downPayment;

    const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const capRate = purchasePrice > 0 ? (netOperatingIncome / purchasePrice) * 100 : 0;
    
    const futureValue = purchasePrice * Math.pow(1 + appreciationRate, holdingPeriod);
    const totalAppreciation = futureValue - purchasePrice;
    
    const totalCashFlow = annualCashFlow * holdingPeriod;
    const totalReturn = totalCashFlow + totalAppreciation;
    const totalROI = totalCashInvested > 0 ? (totalReturn / totalCashInvested) * 100 : 0;
    const annualizedROI = totalROI / holdingPeriod;

    return {
      type: 'Short-Term Investment',
      annualCashFlow,
      cashOnCashReturn,
      capRate,
      totalReturn,
      totalROI,
      annualizedROI,
      futureValue,
      totalAppreciation,
      netOperatingIncome,
      monthlyMortgage,
      effectiveRent
    };
  };

  const calculateLongTermROI = () => {
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const monthlyRent = parseFloat(formData.monthlyRent) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const propertyTaxes = parseFloat(formData.propertyTaxes) || 0;
    const insurance = parseFloat(formData.insurance) || 0;
    const maintenance = parseFloat(formData.maintenance) || 0;
    const vacancyRate = parseFloat(formData.vacancy) / 100;
    const appreciationRate = parseFloat(formData.appreciationRate) / 100;
    const holdingPeriod = parseFloat(formData.holdingPeriod) || 1;

    const annualRent = monthlyRent * 12;
    const effectiveRent = annualRent * (1 - vacancyRate);
    const annualExpenses = (monthlyExpenses + propertyTaxes + insurance + maintenance) * 12;
    const netOperatingIncome = effectiveRent - annualExpenses;

    const loanAmount = purchasePrice - downPayment;
    const monthlyInterestRate = 0.07 / 12;
    const numberOfPayments = 30 * 12;
    const monthlyMortgage = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    const annualMortgage = monthlyMortgage * 12;

    const annualCashFlow = netOperatingIncome - annualMortgage;
    const totalCashInvested = downPayment;

    const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const capRate = purchasePrice > 0 ? (netOperatingIncome / purchasePrice) * 100 : 0;
    
    const futureValue = purchasePrice * Math.pow(1 + appreciationRate, holdingPeriod);
    const totalAppreciation = futureValue - purchasePrice;
    
    const totalCashFlow = annualCashFlow * holdingPeriod;
    const totalReturn = totalCashFlow + totalAppreciation;
    const totalROI = totalCashInvested > 0 ? (totalReturn / totalCashInvested) * 100 : 0;
    const annualizedROI = totalROI / holdingPeriod;

    return {
      type: 'Long-Term Investment',
      annualCashFlow,
      cashOnCashReturn,
      capRate,
      totalReturn,
      totalROI,
      annualizedROI,
      futureValue,
      totalAppreciation,
      netOperatingIncome,
      monthlyMortgage,
      effectiveRent
    };
  };

  const calculateFlippingROI = () => {
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const rehabCost = parseFloat(formData.rehabCost) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const holdingTime = parseFloat(formData.holdingTime) || 6;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;

    const totalInvestment = purchasePrice + rehabCost;
    const totalHoldingCosts = monthlyExpenses * holdingTime;
    const totalCosts = totalInvestment + totalHoldingCosts;
    const grossProfit = sellingPrice - totalCosts;
    const totalROI = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
    const annualizedROI = totalROI * (12 / holdingTime);

    return {
      type: 'Flipping Investment',
      totalInvestment,
      totalCosts,
      grossProfit,
      totalROI,
      annualizedROI,
      holdingTime,
      sellingPrice,
      rehabCost: rehabCost,
      totalHoldingCosts
    };
  };

  const calculateCommercialROI = () => {
    const purchasePrice = parseFloat(formData.purchasePrice) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const netOperatingIncome = parseFloat(formData.netOperatingIncome) || 0;
    const appreciationRate = parseFloat(formData.appreciationRate) / 100;
    const holdingPeriod = parseFloat(formData.holdingPeriod) || 1;

    const capRate = purchasePrice > 0 ? (netOperatingIncome / purchasePrice) * 100 : 0;
    const cashOnCashReturn = downPayment > 0 ? (netOperatingIncome / downPayment) * 100 : 0;
    
    const futureValue = purchasePrice * Math.pow(1 + appreciationRate, holdingPeriod);
    const totalAppreciation = futureValue - purchasePrice;
    const totalCashFlow = netOperatingIncome * holdingPeriod;
    const totalReturn = totalCashFlow + totalAppreciation;
    const totalROI = downPayment > 0 ? (totalReturn / downPayment) * 100 : 0;
    const annualizedROI = totalROI / holdingPeriod;

    return {
      type: 'Commercial Property',
      capRate,
      cashOnCashReturn,
      totalReturn,
      totalROI,
      annualizedROI,
      futureValue,
      totalAppreciation,
      netOperatingIncome,
      annualCashFlow: netOperatingIncome
    };
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="roi-calculator">
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
          <h1>ROI Calculator</h1>
          <p>Analyze potential returns and profits from your real estate investment</p>
        </div>

        <div className="calculator-container">
          <div className="form-section">
            <h2>Investment Details</h2>
            
            {/* Investment Type Selection */}
            <div className="investment-type-section">
              <div className="input-group">
                <label>Investment Type</label>
                <select
                  value={investmentType}
                  onChange={handleInvestmentTypeChange}
                  className="financial-select"
                  required
                >
                  <option value="">Select Investment Type</option>
                  <option value="short-term">Short Term Investment</option>
                  <option value="long-term">Long Term Investment</option>
                  <option value="flipping">Flipping</option>
                  <option value="commercial">Commercial Real Estate</option>
                </select>
              </div>
            </div>

            {/* Dynamic Form Fields */}
            {investmentType && (
              <div className="form-grid">
                {getFormFields().map((field) => (
                  <div key={field.name} className="input-group">
                    <label>{field.label}</label>
                    <input
                      type={field.type}
                      step={field.step}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className="financial-input"
                    />
                  </div>
                ))}
              </div>
            )}

            {investmentType && (
              <button className="calculate-btn" onClick={calculateROI}>
                Calculate {investmentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} ROI
              </button>
            )}
          </div>

          {results && (
            <div className="results-section">
              <h2>Investment Analysis Results</h2>
              
              <div className="results-tabs">
                <div className="main-metrics">
                  <div className="metric-card primary">
                    <div className="metric-label">Total ROI</div>
                    <div className="metric-value">
                      {formatPercentage(results.totalROI)}
                    </div>
                    <div className="metric-sublabel">
                      {formatPercentage(results.annualizedROI)} annually
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Cash-on-Cash Return</div>
                    <div className="metric-value">
                      {formatPercentage(results.cashOnCashReturn)}
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Cap Rate</div>
                    <div className="metric-value">
                      {formatPercentage(results.capRate)}
                    </div>
                  </div>
                </div>

                <div className="financial-breakdown">
                  <h3>Financial Breakdown</h3>
                  
                  <div className="breakdown-grid">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Annual Cash Flow</span>
                      <span className="breakdown-value positive">
                        {formatCurrency(results.annualCashFlow)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <span className="breakdown-label">Net Operating Income</span>
                      <span className="breakdown-value">
                        {formatCurrency(results.netOperatingIncome)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <span className="breakdown-label">Monthly Mortgage</span>
                      <span className="breakdown-value">
                        {formatCurrency(results.monthlyMortgage)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <span className="breakdown-label">Effective Annual Rent</span>
                      <span className="breakdown-value">
                        {formatCurrency(results.effectiveRent)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <span className="breakdown-label">Total Appreciation</span>
                      <span className="breakdown-value positive">
                        {formatCurrency(results.totalAppreciation)}
                      </span>
                    </div>

                    <div className="breakdown-item">
                      <span className="breakdown-label">Future Property Value</span>
                      <span className="breakdown-value">
                        {formatCurrency(results.futureValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="investment-summary">
                  <h3>Investment Summary</h3>
                  <div className="summary-card">
                    <div className="summary-row">
                      <span>Total Return:</span>
                      <span className="highlight">{formatCurrency(results.totalReturn)}</span>
                    </div>
                    <div className="summary-description">
                      {results.totalROI > 15 ? 
                        "🎯 Excellent investment opportunity!" :
                        results.totalROI > 8 ?
                        "✅ Good investment potential" :
                        "⚠️ Consider other opportunities"
                      }
                    </div>
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
  );
};

export default ROICalculator;
