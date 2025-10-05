import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertySearch.css';

const PropertySearch = () => {
  const navigate = useNavigate();
  const [searchCriteria, setSearchCriteria] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    propertyType: 'single-family',
    minBedrooms: '1',
    minBathrooms: '1',
    maxHOA: '',
    yearBuilt: '',
    minRent: '',
    maxRent: ''
  });
  const [properties, setProperties] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchProperties = async () => {
    setIsSearching(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockProperties = [
        {
          id: 1,
          address: "123 Investment Ave, Austin, TX 78701",
          price: 285000,
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1450,
          yearBuilt: 2018,
          estimatedRent: 2200,
          capRate: 8.2,
          cashFlow: 450,
          neighborhood: "East Austin",
          propertyType: "Single Family",
          image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop"
        },
        {
          id: 2,
          address: "456 Rental Road, Dallas, TX 75201",
          price: 195000,
          bedrooms: 2,
          bathrooms: 2,
          sqft: 1100,
          yearBuilt: 2015,
          estimatedRent: 1650,
          capRate: 9.1,
          cashFlow: 380,
          neighborhood: "Deep Ellum",
          propertyType: "Condo",
          image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
        },
        {
          id: 3,
          address: "789 Profit Place, Houston, TX 77001",
          price: 320000,
          bedrooms: 4,
          bathrooms: 3,
          sqft: 1850,
          yearBuilt: 2020,
          estimatedRent: 2800,
          capRate: 7.8,
          cashFlow: 520,
          neighborhood: "Heights",
          propertyType: "Single Family",
          image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"
        },
        {
          id: 4,
          address: "321 Cash Cow Circle, San Antonio, TX 78201",
          price: 165000,
          bedrooms: 2,
          bathrooms: 1,
          sqft: 950,
          yearBuilt: 2012,
          estimatedRent: 1400,
          capRate: 8.9,
          cashFlow: 310,
          neighborhood: "Southtown",
          propertyType: "Townhouse",
          image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=300&fit=crop"
        },
        {
          id: 5,
          address: "654 ROI Ridge, Fort Worth, TX 76101",
          price: 245000,
          bedrooms: 3,
          bathrooms: 2.5,
          sqft: 1300,
          yearBuilt: 2017,
          estimatedRent: 1950,
          capRate: 8.5,
          cashFlow: 425,
          neighborhood: "Cultural District",
          propertyType: "Duplex",
          image: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400&h=300&fit=crop"
        },
        {
          id: 6,
          address: "987 Investment Blvd, Plano, TX 75023",
          price: 375000,
          bedrooms: 4,
          bathrooms: 3,
          sqft: 2100,
          yearBuilt: 2019,
          estimatedRent: 3200,
          capRate: 7.2,
          cashFlow: 580,
          neighborhood: "Legacy West",
          propertyType: "Single Family",
          image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop"
        }
      ];
      
      setProperties(mockProperties);
      setIsSearching(false);
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
    }, 1500);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getROIColor = (capRate) => {
    if (capRate >= 8.5) return '#00ff9d';
    if (capRate >= 7.5) return '#0099ff';
    return '#9900ff';
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
          <h1>Find the Best Investment Properties</h1>
          <p>Search for high-potential investment properties that match your criteria</p>
        </div>

        <div className="form-container">
          <div className="form-header">
            <h2>Property Search Criteria</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); searchProperties(); }} className="search-form">
            
            <div className="search-grid">
              <div className="input-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={searchCriteria.location}
                  onChange={handleInputChange}
                  placeholder="City, State or ZIP"
                  className="search-input"
                />
              </div>

              <div className="input-group">
                <label>Property Type</label>
                <select
                  name="propertyType"
                  value={searchCriteria.propertyType}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="single-family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="duplex">Duplex</option>
                  <option value="multi-family">Multi-Family</option>
                </select>
              </div>

              <div className="input-group">
                <label>Min Price</label>
                <input
                  type="number"
                  name="minPrice"
                  value={searchCriteria.minPrice}
                  onChange={handleInputChange}
                  placeholder="$150,000"
                  className="search-input"
                />
              </div>

              <div className="input-group">
                <label>Max Price</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={searchCriteria.maxPrice}
                  onChange={handleInputChange}
                  placeholder="$400,000"
                  className="search-input"
                />
              </div>

              <div className="input-group">
                <label>Min Bedrooms</label>
                <select
                  name="minBedrooms"
                  value={searchCriteria.minBedrooms}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div className="input-group">
                <label>Min Bathrooms</label>
                <select
                  name="minBathrooms"
                  value={searchCriteria.minBathrooms}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                  <option value="2.5">2.5+</option>
                  <option value="3">3+</option>
                </select>
              </div>

              <div className="input-group">
                <label>Min Rent</label>
                <input
                  type="number"
                  name="minRent"
                  value={searchCriteria.minRent}
                  onChange={handleInputChange}
                  placeholder="$1,200"
                  className="search-input"
                />
              </div>

              <div className="input-group">
                <label>Max Rent</label>
                <input
                  type="number"
                  name="maxRent"
                  value={searchCriteria.maxRent}
                  onChange={handleInputChange}
                  placeholder="$3,500"
                  className="search-input"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="search-btn" 
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search Properties'}
            </button>
          </form>

          <div className="map-section">
            <button 
              className="show-map-btn"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            
            {showMap && (
              <div className="map-container">
                <div className="map-placeholder">
                  <p>Interactive Map Coming Soon</p>
                  <p>Properties will be displayed on map based on search results</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showResults && properties.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>Investment Properties Found</h2>
              <div className="results-count">{properties.length} properties match your criteria</div>
            </div>

            <div className="properties-grid">
              {properties.map(property => (
                <div key={property.id} className="property-card">
                  <div className="property-image">
                    <img src={property.image} alt={property.address} />
                    <div className="property-type-badge">{property.propertyType}</div>
                  </div>
                  
                  <div className="property-content">
                    <div className="property-address">{property.address}</div>
                    <div className="property-neighborhood">{property.neighborhood}</div>
                    
                    <div className="property-details">
                      <div className="detail-item">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">{formatCurrency(property.price)}</span>
                      </div>
                      
                      <div className="property-specs">
                        <span>{property.bedrooms} bed</span>
                        <span>{property.bathrooms} bath</span>
                        <span>{property.sqft.toLocaleString()} sqft</span>
                        <span>{property.yearBuilt}</span>
                      </div>
                    </div>

                    <div className="investment-metrics">
                      <div className="metric">
                        <div className="metric-label">Est. Rent</div>
                        <div className="metric-value">{formatCurrency(property.estimatedRent)}/mo</div>
                      </div>
                      
                      <div className="metric">
                        <div className="metric-label">Cap Rate</div>
                        <div 
                          className="metric-value" 
                          style={{ color: getROIColor(property.capRate) }}
                        >
                          {property.capRate}%
                        </div>
                      </div>
                      
                      <div className="metric">
                        <div className="metric-label">Cash Flow</div>
                        <div className="metric-value positive">
                          +{formatCurrency(property.cashFlow)}/mo
                        </div>
                      </div>
                    </div>

                    <div className="property-actions">
                      <button className="action-btn primary">
                        View Details
                      </button>
                      <button className="action-btn secondary">
                        Calculate ROI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="load-more-section">
              <button className="load-more-btn">
                Load More Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
