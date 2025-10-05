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
import "./App.css";

function MapSearchControl({ setIsDrawing }) {
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
      .on("expand", function() {
        // Disable drawing when search is expanded
        if (window.freehandDrawing) {
          window.freehandDrawing = false;
          map.dragging.enable();
          map.getContainer().style.cursor = '';
          // Reset drawing state in parent component
          if (setIsDrawing) setIsDrawing(false);
          console.log('Drawing disabled due to search expansion');
        }
      })
      .addTo(map);
    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);
  return null;
}

function DrawBoundary({ onBoundaryDrawn, onZipCodesFound, onClearDrawing, setIsDrawing }) {
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
    
    let isDrawing = false;
    let currentPolyline = null;
    
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
    
    // Custom freehand drawing handlers
    const handleMouseDown = (e) => {
      if (!window.freehandDrawing) return;
      
      console.log('Drawing mousedown/touchstart triggered:', e.type);
      
      // Prevent default behavior for touch events to avoid page scrolling
      if (e.originalEvent && e.originalEvent.preventDefault) {
        e.originalEvent.preventDefault();
      }
      
      isDrawing = true;
      items.clearLayers();
      
      currentPolyline = L.polyline([e.latlng], {
        color: '#3388ff',
        weight: 4,
        opacity: 0.8
      }).addTo(items);
      
      console.log('Started drawing polyline at:', e.latlng);
    };
    
    const handleMouseMove = (e) => {
      if (!window.freehandDrawing || !isDrawing || !currentPolyline) return;
      
      // Prevent default behavior for touch events to avoid page scrolling
      if (e.originalEvent && e.originalEvent.preventDefault) {
        e.originalEvent.preventDefault();
      }
      
      currentPolyline.addLatLng(e.latlng);
    };
    
    const handleMouseUp = async (e) => {
      console.log('Drawing mouseup/touchend triggered:', e.type);
      if (!window.freehandDrawing || !isDrawing || !currentPolyline) return;
      
      // Add a small delay to prevent accidental button clicks
      setTimeout(() => {
        isDrawing = false;
        window.freehandDrawing = false;
        map.dragging.enable();
        map.getContainer().style.cursor = '';
        
        // Reset drawing state in parent component
        if (setIsDrawing) setIsDrawing(false);
      }, 100);
      
      // Convert polyline to polygon for zip code detection
      const latlngs = currentPolyline.getLatLngs();
      console.log('Drawing completed, polyline points:', latlngs.length);
      
      if (latlngs.length > 2) {
        // Close the polygon by adding the first point at the end
        latlngs.push(latlngs[0]);
        
        // Create a polygon from the polyline
        const polygon = L.polygon(latlngs, {
          color: '#3388ff',
          weight: 4,
          opacity: 0.5,
          fill: true,
          fillOpacity: 0.2
        });
        
        items.clearLayers();
        items.addLayer(polygon);
        
        const geoJson = polygon.toGeoJSON();
        console.log('Polygon created, starting zip code search...');
        if (onBoundaryDrawn) onBoundaryDrawn(geoJson);
        
        // Find intersecting zip codes
        try {
          console.log('Drawn freehand polygon GeoJSON:', geoJson);
          console.log('About to call findIntersectingZipCodes...');
          const intersectingZips = await findIntersectingZipCodes(geoJson);
          console.log('findIntersectingZipCodes returned:', intersectingZips);
          if (intersectingZips.length > 0 && onZipCodesFound) {
            console.log('Calling onZipCodesFound with', intersectingZips.length, 'zip codes');
            onZipCodesFound(intersectingZips);
          } else {
            console.log('No intersecting zip codes found, length:', intersectingZips.length);
          }
        } catch (error) {
          console.error('Error finding intersecting zip codes:', error);
        }
      }
      
      currentPolyline = null;
    };
    
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    
    // Add both mouse and touch event handlers for drawing
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    
    // Touch events for mobile support
    map.on('touchstart', handleMouseDown);
    map.on('touchmove', handleMouseMove);
    map.on('touchend', handleMouseUp);
    
    // Additional touch event handling for better mobile support
    map.getContainer().addEventListener('touchend', (e) => {
      if (window.freehandDrawing && isDrawing) {
        console.log('Container touchend detected');
        // Create a synthetic event for handleMouseUp
        const syntheticEvent = {
          type: 'touchend',
          latlng: map.mouseEventToLatLng(e.changedTouches[0])
        };
        handleMouseUp(syntheticEvent);
      }
    }, { passive: false });
    
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      map.off('touchstart', handleMouseDown);
      map.off('touchmove', handleMouseMove);
      map.off('touchend', handleMouseUp);
      if (map.hasLayer(items)) {
        map.removeLayer(items);
      }
    };
  }, [map, onBoundaryDrawn, onZipCodesFound]);
  
  return null;
}

const InvestmentFinder = () => {
  const navigate = useNavigate();
  const [zipInput, setZipInput] = useState("");
  const [selectedZips, setSelectedZips] = useState([]);
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(1000000);
  const [constructionYearMin, setConstructionYearMin] = useState("");
  const [constructionYearMax, setConstructionYearMax] = useState("");
  const [bedrooms, setBedrooms] = useState("any");
  const [houseAreaMin, setHouseAreaMin] = useState("");
  const [houseAreaMax, setHouseAreaMax] = useState("");
  const [boundary, setBoundary] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetailedOptions, setShowDetailedOptions] = useState(false);
  const [activeSlider, setActiveSlider] = useState(null);
  const [showAllZips, setShowAllZips] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const minSliderRef = useRef(null);
  const maxSliderRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResults(true);
  };

  const handleToggleDetails = () => {
    if (showDetailedOptions) {
      setConstructionYearMin("");
      setConstructionYearMax("");
      setBedrooms("any");
      setHouseAreaMin("");
      setHouseAreaMax("");
    }
    setShowDetailedOptions(!showDetailedOptions);
  };

  const handleZipCodesFound = (newZips) => {
    console.log('handleZipCodesFound called with:', newZips);
    setSelectedZips(currentZips => {
      const existingZipCodes = new Set(currentZips.map(z => typeof z === 'string' ? z : z.zip));
      const uniqueNewZips = newZips.filter(newZip => 
        !existingZipCodes.has(newZip.zip)
      );
      console.log('Adding unique new zips:', uniqueNewZips);
      return [...currentZips, ...uniqueNewZips];
    });
  };

  const handleClearDrawing = () => {
    setSelectedZips([]);
    setBoundary(null);
    if (window.mapInstance && window.drawnItems) {
      window.drawnItems.clearLayers();
    }
  };

  return (
    <div className="main-container">
      <header style={{ position: 'relative' }}>
        <button 
          onClick={() => navigate('/#tools')}
          style={{
            position: 'absolute',
            top: '16px',
            left: '24px',
            width: '40px',
            height: '40px',
            padding: '0',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Back to Home"
        >
          ←
        </button>
        <h1>Find the Best Investment Properties</h1>
        <p className="header-description">Draw your area of interest or enter a zip code, and tell us your investment preferences.</p>
      </header>
      <div className="content">
        <form className="prefs-form" onSubmit={handleSubmit}>
          <label>
            Budget Range:
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
          
          <button 
            type="button"
            onClick={() => setShowDetailedOptions(!showDetailedOptions)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: showDetailedOptions ? '#3b82f6' : '#475569',
              color: 'white',
              borderRadius: '8px'
            }}
          >
            {showDetailedOptions ? 'Use smart defaults' : 'Add more details'}
          </button>

          {/* Detailed options - shown only when requested */}
          {showDetailedOptions && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#334155', 
              borderRadius: '8px', 
              border: '1px solid #475569'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <label style={{ marginBottom: '4px', fontSize: '14px', color: '#e2e8f0' }}>Construction Year:</label>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
                    <input
                      type="text"
                      placeholder="No min"
                      value={constructionYearMin}
                      onChange={(e) => setConstructionYearMin(e.target.value)}
                      style={{
                        width: '75px',
                        padding: '4px 8px',
                        border: '2px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: constructionYearMin ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="No max"
                      value={constructionYearMax}
                      onChange={(e) => setConstructionYearMax(e.target.value)}
                      style={{
                        width: '75px',
                        padding: '4px 8px',
                        border: '2px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: constructionYearMax ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <label style={{ marginBottom: '4px', fontSize: '14px', color: '#e2e8f0' }}>House Area (sq ft):</label>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <input
                      type="text"
                      placeholder="No min"
                      value={houseAreaMin}
                      onChange={(e) => setHouseAreaMin(e.target.value)}
                      style={{
                        width: '75px',
                        padding: '4px 8px',
                        border: '2px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: houseAreaMin ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="No max"
                      value={houseAreaMax}
                      onChange={(e) => setHouseAreaMax(e.target.value)}
                      style={{
                        width: '75px',
                        padding: '4px 8px',
                        border: '2px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: houseAreaMax ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              </div>
              <label style={{ marginTop: '16px' }}>
                Number of Bedrooms:
                <select 
                  value={bedrooms} 
                  onChange={(e) => setBedrooms(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #475569',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    marginTop: '4px'
                  }}
                >
                  <option value="any">Any</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </label>
            </div>
          )}

          <button 
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="open-map-btn"
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: showMap ? '#10b981' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showMap ? 'Close Map' : 'Open Map'}
          </button>

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
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            See my best investment options
          </button>
        </form>
        
        <div className={`map-section ${showMap ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div style={{ position: 'relative', height: '100%' }}>
            <MapContainer
              center={[35.2271, -80.8431]}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
              <MapSearchControl setIsDrawing={setIsDrawing} />
              <ZipPolygons selectedZips={selectedZips} />
              <FeatureGroup>{<DrawBoundary onBoundaryDrawn={setBoundary} onZipCodesFound={handleZipCodesFound} onClearDrawing={handleClearDrawing} setIsDrawing={setIsDrawing} />}</FeatureGroup>
            </MapContainer>
            
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              zIndex: 1000, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2px' 
            }}>
              <ZipCodeBar
                selectedZips={selectedZips}
                setSelectedZips={setSelectedZips}
                zipInput={zipInput}
                setZipInput={setZipInput}
                showAllZips={showAllZips}
                setShowAllZips={setShowAllZips}
              />
            </div>
            
            <div style={{ position: 'absolute', top: '50px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                onClick={() => {
                  if (window.mapInstance) {
                    window.mapInstance.zoomIn();
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
                  touchAction: 'manipulation'
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
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >−</button>
            </div>
            
            <div style={{ position: 'absolute', top: '130px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                onClick={() => {
                  if (window.mapInstance) {
                    if (!isDrawing) {
                      window.freehandDrawing = true;
                      window.mapInstance.dragging.disable();
                      window.mapInstance.getContainer().style.cursor = 'crosshair';
                      setIsDrawing(true);
                    } else {
                      window.freehandDrawing = false;
                      window.mapInstance.dragging.enable();
                      window.mapInstance.getContainer().style.cursor = '';
                      setIsDrawing(false);
                    }
                  }
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: isDrawing ? '#3b82f6' : 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  color: isDrawing ? 'white' : 'black'
                }}
              >✏️</button>
              <button 
                onClick={handleClearDrawing}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: 'white',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >🗑️</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Section - Inline at bottom */}
      {showResults && (
        <div style={{
          backgroundColor: '#334155',
          borderRadius: '16px',
          padding: '24px',
          margin: '16px 0',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ 
            color: '#3b82f6', 
            marginBottom: '12px',
            fontSize: '1.4rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Filtered Investment Properties
          </h2>
          <p style={{ 
            color: '#94a3b8', 
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            Results will appear here after API integration.
          </p>
          
          {/* Search Summary */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              color: '#e2e8f0', 
              fontSize: '1rem', 
              marginBottom: '12px',
              fontWeight: '500'
            }}>
              Search Criteria:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <p style={{ color: '#94a3b8' }}>
                <strong>Budget:</strong> ${(budgetMin / 1000).toFixed(0)}k - ${budgetMax === 1000000 ? 'No max' : (budgetMax / 1000).toFixed(0) + 'k'}
              </p>
              <p style={{ color: '#94a3b8' }}>
                <strong>Areas:</strong> {selectedZips.length > 0 ? `${selectedZips.length} zip codes` : 'Custom area'}
              </p>
              {constructionYearMin || constructionYearMax ? (
                <p style={{ color: '#94a3b8' }}>
                  <strong>Built:</strong> {constructionYearMin || 'Any'} - {constructionYearMax || 'Any'}
                </p>
              ) : null}
              {houseAreaMin || houseAreaMax ? (
                <p style={{ color: '#94a3b8' }}>
                  <strong>Area:</strong> {houseAreaMin || 'Any'} - {houseAreaMax || 'Any'} sq ft
                </p>
              ) : null}
              {bedrooms !== 'any' ? (
                <p style={{ color: '#94a3b8' }}>
                  <strong>Bedrooms:</strong> {bedrooms}
                </p>
              ) : null}
            </div>
          </div>

          {/* Placeholder for actual results */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            border: '2px dashed #475569'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
            <h3 style={{ color: '#e2e8f0', marginBottom: '8px', fontSize: '1.1rem' }}>
              Property Results Coming Soon
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
              This is where filtered investment properties will be displayed.<br/>
              Integration with property APIs is in development.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setShowResults(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#475569',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Modify Search
            </button>
            <button
              onClick={() => {
                alert('🚀 Export and detailed analysis features coming soon!');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Export Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentFinder;
