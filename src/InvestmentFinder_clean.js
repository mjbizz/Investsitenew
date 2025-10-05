import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-control-geocoder";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, useMap } from "react-leaflet";
import { useNavigate } from 'react-router-dom';
import ZipCodeBar from "./ZipCodeBar";
import ZipPolygons from "./ZipPolygons";
import BudgetRangeSlider from "./BudgetRangeSlider";
import { findIntersectingZipCodes } from "./utils/geoUtils";
import "./PropertySearch.css";

const InvestmentFinder = () => {
  const navigate = useNavigate();
  const [zipInput, setZipInput] = useState("");
  const [showDetailedOptions, setShowDetailedOptions] = useState(false);
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(1000000);
  const [showMap, setShowMap] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [constructionYearMin, setConstructionYearMin] = useState("");
  const [constructionYearMax, setConstructionYearMax] = useState("");
  const [bedrooms, setBedrooms] = useState("any");
  const [houseAreaMin, setHouseAreaMin] = useState("");
  const [houseAreaMax, setHouseAreaMax] = useState("");
  const [selectedZips, setSelectedZips] = useState([]);
  const [boundary, setBoundary] = useState(null);
  const [activeSlider, setActiveSlider] = useState(null);
  const [showAllZips, setShowAllZips] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const minSliderRef = useRef(null);
  const maxSliderRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResults(true);
    
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

  return (
    <div className="property-search">
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
          <h1 style={{ color: '#00ff9d' }}>Find the Best Investment Properties</h1>
          <p>Search for high-potential investment properties that match your criteria</p>
        </div>

        <div className="form-container"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="form-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#00ff9d', fontSize: '1.8rem', fontWeight: '600', margin: '0' }}>
              Property Search Criteria
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                Budget Range
              </label>
              <BudgetRangeSlider
                minValue={0}
                maxValue={1000000}
                step={10000}
                currentMin={budgetMin}
                currentMax={budgetMax}
                onRangeChange={({ min, max }) => {
                  setBudgetMin(min);
                  setBudgetMax(max);
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                Investment Horizon
              </label>
              <select style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px' }}>
                <option value="short">Short term (1-3 years)</option>
                <option value="mid">Mid term (3-5 years)</option>
                <option value="long">Long term (+5 years)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                Property Type
              </label>
              <select style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px' }}>
                <option value="any">Any</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="multi-family">Multi-Family</option>
              </select>
            </div>
          
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '18px',
                background: 'linear-gradient(135deg, #00ff9d, #0099ff)',
                border: 'none',
                borderRadius: '12px',
                color: '#000000',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Search Properties
            </button>
          </form>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button 
              onClick={() => setShowMap(!showMap)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            
            {showMap && (
              <div style={{ 
                marginTop: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '40px',
                backdropFilter: 'blur(20px)'
              }}>
                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem' }}>
                  Interactive Map Coming Soon
                </p>
                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', margin: '10px 0' }}>
                  Properties will be displayed on map based on search results
                </p>
              </div>
            )}
          </div>
        </div>

        {showResults && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px',
            backdropFilter: 'blur(20px)',
            maxWidth: '800px',
            margin: '60px auto 0'
          }}>
            <h2 style={{ color: '#00ff9d', textAlign: 'center', marginBottom: '30px', fontSize: '1.8rem', fontWeight: '600' }}>
              Investment Properties Found
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px', fontSize: '1.1rem' }}>
              Based on your search criteria, here are the best investment opportunities:
            </p>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '15px',
                padding: '25px'
              }}>
                <h3 style={{ color: '#00ff9d', marginBottom: '15px' }}>Sample Investment Property</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '20px' }}>
                  123 Investment Ave, Austin, TX 78701
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '12px' }}>PRICE</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>$285,000</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '12px' }}>CAP RATE</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>8.2%</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '12px' }}>CASH FLOW</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>$450/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentFinder;
