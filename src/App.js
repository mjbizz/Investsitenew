import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import InvestmentFinder from './InvestmentFinder';
import InvestmentTypeNew from './InvestmentTypeNew';
import BuyingPower from './BuyingPower';
import ROICalculator from './ROICalculator';
import PropertySearch from './PropertySearch';
import PropertySearchBackup from './PropertySearchBackup';
import InvestmentTypes from './InvestmentTypes';
import ScrollToTop from './ScrollToTop';

function App() {
  // Use basename only in production (GitHub Pages)
  const basename = process.env.NODE_ENV === 'production' ? '/Investsitenew' : '';
  
  return (
    <Router basename={basename}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/investment-types" element={<InvestmentTypes />} />
        <Route path="/investment-finder" element={<InvestmentTypeNew />} />
        <Route path="/investment-finder-backup" element={<InvestmentFinder />} />
        <Route path="/buying-power" element={<BuyingPower />} />
        <Route path="/roi-calculator" element={<ROICalculator />} />
        <Route path="/property-search" element={<InvestmentFinder />} />
        <Route path="/property-search-backup" element={<PropertySearchBackup />} />
      </Routes>
    </Router>
  );
}

export default App;
