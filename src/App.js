import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-control-geocoder";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, useMap } from "react-leaflet";
import ZipCodeBar from "./ZipCodeBar";
import ZipPolygons from "./ZipPolygons";
import { findIntersectingZipCodes } from "./utils/geoUtils";
import "./App.css";

function MapSearchControl() {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !window.L.Control.Geocoder) return;
    
    // Store map instance globally
    window.mapInstance = map;
    console.log('Map instance stored:', map);
    
    const geocoder = window.L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: "Search location...",
      geocoder: window.L.Control.Geocoder.nominatim(),
    })
      .on("markgeocode", function (e) {
        const bbox = e.geocode.bbox;
        const bounds = L.latLngBounds([
          [bbox.getSouth(), bbox.getWest()],
          [bbox.getNorth(), bbox.getEast()],
        ]);
        map.fitBounds(bounds);
      })
      .addTo(map);
    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);
  return null;
}


function DrawBoundary({ onBoundaryDrawn, onZipCodesFound, onClearDrawing }) {
  const map = useMapEvents({
    click() {},
  });
  const [drawnItems, setDrawnItems] = React.useState(null);
  
  React.useEffect(() => {
    if (!map) return;
    
    const items = new L.FeatureGroup();
    map.addLayer(items);
    setDrawnItems(items);
    
    // Store drawn items globally for clear button access
    window.drawnItems = items;
    
    const handleDrawCreated = async (e) => {
      items.clearLayers();
      items.addLayer(e.layer);
      const geoJson = e.layer.toGeoJSON();
      if (onBoundaryDrawn) onBoundaryDrawn(geoJson);
      
      // Find intersecting zip codes
      try {
        console.log('Drawn polygon GeoJSON:', geoJson);
        const intersectingZips = await findIntersectingZipCodes(geoJson);
        console.log('Found intersecting zip codes:', intersectingZips);
        if (intersectingZips.length > 0 && onZipCodesFound) {
          onZipCodesFound(intersectingZips);
        } else {
          console.log('No intersecting zip codes found');
        }
      } catch (error) {
        console.error('Error finding intersecting zip codes:', error);
      }
    };
    
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      if (map.hasLayer(items)) {
        map.removeLayer(items);
      }
    };
  }, [map, onBoundaryDrawn, onZipCodesFound]);
  
  return null;
}



function App() {
  const [zipInput, setZipInput] = useState("");
  const [selectedZips, setSelectedZips] = useState([]); // [{zip, geojson, bounds}]
  const [budgetMin, setBudgetMin] = useState(100000);
  const [budgetMax, setBudgetMax] = useState(1000000);
  const [constructionYearMin, setConstructionYearMin] = useState("1950");
  const [constructionYearMax, setConstructionYearMax] = useState("2024");
  const [bedrooms, setBedrooms] = useState("any");
  const [houseAreaMin, setHouseAreaMin] = useState(500);
  const [houseAreaMax, setHouseAreaMax] = useState(5000);
  const [boundary, setBoundary] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetailedOptions, setShowDetailedOptions] = useState(false);
  const [activeSlider, setActiveSlider] = useState(null);
  const [showAllZips, setShowAllZips] = useState(false);
  
  const minSliderRef = useRef(null);
  const maxSliderRef = useRef(null);


  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResults(true);
  };

  const handleToggleDetails = () => {
    if (showDetailedOptions) {
      // Hide details and clear inputs - let model pick best answers
      setConstructionYearMin("1950");
      setConstructionYearMax("2024");
      setBedrooms("any");
      setHouseAreaMin(500);
      setHouseAreaMax(5000);
    }
    setShowDetailedOptions(!showDetailedOptions);
  };

  const handleZipCodesFound = (newZips) => {
    setSelectedZips(currentZips => {
      // Get existing zip codes for duplicate checking
      const existingZipCodes = new Set(currentZips.map(z => typeof z === 'string' ? z : z.zip));
      
      // Filter out duplicates and add new zip objects
      const uniqueNewZips = newZips.filter(z => !existingZipCodes.has(z.zip));
      
      return [...currentZips, ...uniqueNewZips];
    });
  };

  const handleClearDrawing = () => {
    // Clear selected zip codes
    setSelectedZips([]);
    // Clear boundary as well
    setBoundary(null);
    // Clear the drawn items from the map
    if (window.mapInstance && window.drawnItems) {
      window.drawnItems.clearLayers();
    }
  };

  return (
    <div className="main-container">
      <header>
        <h1>Find the Best Investment Properties</h1>
        <p>Draw your area of interest or enter a zip code, and tell us your investment preferences.</p>
      </header>
      <div className="content">
        <div className="map-section">
          <div style={{ position: 'relative', height: '100%' }}>
            <MapContainer
              center={[35.2271, -80.8431]}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
              <MapSearchControl />
              <ZipPolygons selectedZips={selectedZips} />
              <FeatureGroup>{<DrawBoundary onBoundaryDrawn={setBoundary} onZipCodesFound={handleZipCodesFound} onClearDrawing={handleClearDrawing} />}</FeatureGroup>
            </MapContainer>
            
            {/* Zip Code Search - Top Right */}
            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <ZipCodeBar
                selectedZips={selectedZips}
                setSelectedZips={setSelectedZips}
                zipInput={zipInput}
                setZipInput={setZipInput}
              />
              
              {/* Selected Zip Codes Display */}
              {selectedZips.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(showAllZips ? selectedZips : selectedZips.slice(0, 3)).map((zip, index) => (
                    <div
                      key={typeof zip === 'string' ? zip : zip.zip}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textAlign: 'center',
                        width: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{typeof zip === 'string' ? zip : zip.zip}</span>
                      <button
                        onClick={() => {
                          const zipCode = typeof zip === 'string' ? zip : zip.zip;
                          setSelectedZips(zips => zips.filter(z => (typeof z === 'string' ? z : z.zip) !== zipCode));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedZips.length > 3 && (
                    <div
                      onClick={() => setShowAllZips(!showAllZips)}
                      style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textAlign: 'center',
                        minWidth: '60px',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 1)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.9)'}
                    >
                      {showAllZips ? 'Show less' : `+${selectedZips.length - 3} more`}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Zoom Controls - Top Left (below search) */}
            <div style={{ position: 'absolute', top: '60px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                onClick={() => {
                  console.log('NEW: Zoom in clicked, mapInstance:', window.mapInstance);
                  if (window.mapInstance) {
                    window.mapInstance.zoomIn();
                    console.log('NEW: Zoom in executed');
                  } else {
                    console.log('NEW: No mapInstance found');
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >+</button>
              <button 
                onClick={() => {
                  if (window.mapInstance) {
                    window.mapInstance.zoomOut();
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >−</button>
            </div>
            
            {/* Drawing Tools - Below Zoom Controls */}
            <div style={{ position: 'absolute', top: '140px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                onClick={() => {
                  if (window.mapInstance) {
                    new L.Draw.Rectangle(window.mapInstance, {}).enable();
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333'
                }}
                title="Draw Rectangle"
              >▢</button>
              <button 
                onClick={() => {
                  if (window.mapInstance) {
                    new L.Draw.Polygon(window.mapInstance, {}).enable();
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333'
                }}
                title="Draw Polygon"
              >⬟</button>
              <button 
                onClick={handleClearDrawing}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333'
                }}
                title="Clear Zip Codes"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <form className="prefs-form" onSubmit={handleSubmit}>
          <label>
            Budget Range:
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Min:</span>
                <input
                  type="text"
                  value={budgetMin.toLocaleString()}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setBudgetMin(Math.min(numValue, budgetMax - 50000));
                  }}
                  style={{ width: '120px', padding: '4px', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Max:</span>
                <input
                  type="text"
                  value={budgetMax.toLocaleString()}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setBudgetMax(Math.max(numValue, budgetMin + 50000));
                  }}
                  style={{ width: '120px', padding: '4px', fontSize: '12px' }}
                />
              </div>
            </div>
          </label>
          <label>
            Investment Horizon:
            <select>
              <option value="short">Short term (1-3 years)</option>
              <option value="mid">Mid term (3-5 years)</option>
              <option value="long">Long term (+5 years)</option>
            </select>
          </label>
          <label>
            Property Type:
            <select>
              <option value="any">Any</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="multi-family">Multi-Family</option>
            </select>
          </label>
          
          {/* Toggle details button */}
          <div style={{ margin: '20px 0 0 0' }}>
            <button 
              type="button"
              onClick={handleToggleDetails}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: showDetailedOptions ? '#3b82f6' : '#475569',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '0'
              }}
            >
              {showDetailedOptions ? 'Use smart defaults' : 'I want to add more details'}
            </button>
          </div>

          {/* Show best options button - appears when details are hidden */}
          {!showDetailedOptions && (
            <button 
              type="button"
              onClick={(e) => {
                handleSubmit(e);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                margin: '0',
                marginBottom: '20px'
              }}
            >
              See my best investment options
            </button>
          )}

          {/* Detailed options - shown only when requested */}
          {showDetailedOptions && (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#334155', borderRadius: '8px', border: '1px solid #475569' }}>
              <label>
                Construction Year:
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Min:</span>
                    <select 
                      value={constructionYearMin} 
                      onChange={(e) => setConstructionYearMin(e.target.value)}
                      style={{ width: '100px', padding: '4px 8px', border: '2px solid #475569', borderRadius: '8px', fontSize: '12px', background: '#1e293b', color: '#e2e8f0' }}
                    >
                      <option value="1900">1900</option>
                      <option value="1920">1920</option>
                      <option value="1940">1940</option>
                      <option value="1950">1950</option>
                      <option value="1960">1960</option>
                      <option value="1970">1970</option>
                      <option value="1980">1980</option>
                      <option value="1990">1990</option>
                      <option value="2000">2000</option>
                      <option value="2010">2010</option>
                      <option value="2020">2020</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Max:</span>
                    <select 
                      value={constructionYearMax} 
                      onChange={(e) => setConstructionYearMax(e.target.value)}
                      style={{ width: '100px', padding: '4px 8px', border: '2px solid #475569', borderRadius: '8px', fontSize: '12px', background: '#1e293b', color: '#e2e8f0' }}
                    >
                      <option value="1920">1920</option>
                      <option value="1940">1940</option>
                      <option value="1950">1950</option>
                      <option value="1960">1960</option>
                      <option value="1970">1970</option>
                      <option value="1980">1980</option>
                      <option value="1990">1990</option>
                      <option value="2000">2000</option>
                      <option value="2010">2010</option>
                      <option value="2020">2020</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                </div>
              </label>
              <label>
                Number of Bedrooms:
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                  <option value="any">Any</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </label>
              <label>
                House Area (sq ft):
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Min:</span>
                    <input
                      type="number"
                      value={houseAreaMin}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        setHouseAreaMin(Math.min(numValue, houseAreaMax - 100));
                      }}
                      min="500"
                      max="10000"
                      style={{ width: '100px', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Max:</span>
                    <input
                      type="number"
                      value={houseAreaMax}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 0;
                        setHouseAreaMax(Math.max(numValue, houseAreaMin + 100));
                      }}
                      min="500"
                      max="10000"
                      style={{ width: '100px', padding: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </label>
            </div>
          )}
          
          {/* Show best options button - appears at bottom when details are shown */}
          {showDetailedOptions && (
            <button 
              type="button"
              onClick={(e) => {
                handleSubmit(e);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              See my best investment options
            </button>
          )}
        </form>
      </div>
      {showResults && (
        <section className="results-placeholder">
          <h2>Filtered Investment Properties</h2>
          <p>Results will appear here after API integration.</p>
        </section>
      )}
    </div>
  );
}

export default App;
