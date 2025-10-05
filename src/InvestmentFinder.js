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
// We'll load the charlotte_zips data differently since direct .geojson import may not work
import "./PropertySearch.css";

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

  // Function to add zip code with real geographic data from the same NC API
  const addZipCodeWithGeometry = async (zipCode) => {
    try {
      console.log(`Looking up real boundaries for zip code: ${zipCode}`);
      
      // Use the same NC zip data source as the freehand drawing tool
      const url = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nc_north_carolina_zip_codes_geo.min.json";
      const response = await fetch(url);
      const zipData = await response.json();
      
      console.log('Loaded NC zip data, searching for zip:', zipCode);
      
      // Find the zip code in the NC data (same as freehand tool)
      const zipFeature = zipData.features.find(feature => {
        const featureZip = feature.properties.ZCTA5CE10 || feature.properties.zip;
        return featureZip && featureZip.toString().padStart(5, '0') === zipCode.padStart(5, '0');
      });

      if (zipFeature) {
        console.log(`Found real geometry for zip code ${zipCode}:`, zipFeature);
        
        // Zoom map to the zip code area if map is available
        if (window.mapInstance && zipFeature.geometry) {
          const coords = zipFeature.geometry.coordinates[0];
          if (coords && coords.length > 0) {
            // Calculate bounds from coordinates
            let minLat = Infinity, maxLat = -Infinity;
            let minLng = Infinity, maxLng = -Infinity;
            
            coords.forEach(coord => {
              const [lng, lat] = coord;
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            });
            
            console.log(`Zooming to real zip bounds: [[${minLat}, ${minLng}], [${maxLat}, ${maxLng}]]`);
            window.mapInstance.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [20, 20] });
          }
        }
        
        return { 
          zip: zipCode.padStart(5, '0'), 
          geojson: zipFeature, 
          notfound: false 
        };
      } else {
        console.log(`No real geometry found for zip code ${zipCode} in NC data`);
        // For zip codes not found, create a basic object
        return { zip: zipCode, geojson: null, notfound: true };
      }
    } catch (error) {
      console.error('Error fetching zip code geometry:', error);
      return { zip: zipCode, geojson: null, notfound: true };
    }
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

        <div className={`main-layout ${showMap ? 'with-map' : 'no-map'}`} style={{
          display: 'grid',
          gridTemplateColumns: showMap ? '1fr 1fr' : '1fr',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          alignItems: 'start'
        }}>
          <div className="form-container"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '30px',
              backdropFilter: 'blur(20px)',
              width: '360px',
              minWidth: '360px',
              maxWidth: '360px'
            }}
          >
          <div className="form-header" style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 style={{ color: '#00ff9d', fontSize: '1.5rem', fontWeight: '600', margin: '0' }}>
              Property Search Criteria
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', margin: '0 auto' }}>
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
              <select style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="short" style={{ background: '#1e293b', color: '#ffffff' }}>Short term (1-3 years)</option>
                <option value="mid" style={{ background: '#1e293b', color: '#ffffff' }}>Mid term (3-5 years)</option>
                <option value="long" style={{ background: '#1e293b', color: '#ffffff' }}>Long term (+5 years)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                Property Type
              </label>
              <select style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="any" style={{ background: '#1e293b', color: '#ffffff' }}>Any</option>
                <option value="residential" style={{ background: '#1e293b', color: '#ffffff' }}>Residential</option>
                <option value="commercial" style={{ background: '#1e293b', color: '#ffffff' }}>Commercial</option>
                <option value="multi-family" style={{ background: '#1e293b', color: '#ffffff' }}>Multi-Family</option>
              </select>
            </div>
          
            <button 
              type="button"
              onClick={() => setShowDetailedOptions(!showDetailedOptions)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: showDetailedOptions ? '#3b82f6' : '#475569',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
            >
              {showDetailedOptions ? 'Use smart defaults' : 'Add more details'}
            </button>

          {/* Detailed options - shown only when requested */}
          {showDetailedOptions && (
            <>
              {/* Construction Year */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                  Construction Year
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Min year"
                    value={constructionYearMin}
                    onChange={(e) => setConstructionYearMin(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>to</span>
                  <input
                    type="text"
                    placeholder="Max year"
                    value={constructionYearMax}
                    onChange={(e) => setConstructionYearMax(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* House Area */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                  House Area (sq ft)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Min sq ft"
                    value={houseAreaMin}
                    onChange={(e) => setHouseAreaMin(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>to</span>
                  <input
                    type="text"
                    placeholder="Max sq ft"
                    value={houseAreaMax}
                    onChange={(e) => setHouseAreaMax(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Number of Bedrooms */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px', textAlign: 'center' }}>
                  Number of Bedrooms
                </label>
                <select 
                  value={bedrooms} 
                  onChange={(e) => setBedrooms(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="any" style={{ background: '#1e293b', color: '#e2e8f0' }}>Any</option>
                  <option value="1" style={{ background: '#1e293b', color: '#e2e8f0' }}>1 Bedroom</option>
                  <option value="2" style={{ background: '#1e293b', color: '#e2e8f0' }}>2 Bedrooms</option>
                  <option value="3" style={{ background: '#1e293b', color: '#e2e8f0' }}>3 Bedrooms</option>
                  <option value="4" style={{ background: '#1e293b', color: '#e2e8f0' }}>4 Bedrooms</option>
                  <option value="5" style={{ background: '#1e293b', color: '#e2e8f0' }}>5+ Bedrooms</option>
                </select>
              </div>
            </>
          )}

            {/* Zip Code Management Section */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '14px' }}>
                Zip Codes (Optional)
              </label>
              
              {/* Line 1: Zip Code Input, Add Button, Clear Button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. 28277"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (zipInput && !selectedZips.some(zip => (typeof zip === 'string' ? zip : zip.zip) === zipInput)) {
                        const zipWithGeometry = await addZipCodeWithGeometry(zipInput);
                        setSelectedZips(prev => [...prev, zipWithGeometry]);
                        setZipInput("");
                      }
                    }
                  }}
                  style={{ 
                    flex: 1,
                    padding: '12px 16px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '8px', 
                    color: '#ffffff', 
                    fontFamily: 'Space Grotesk, sans-serif', 
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="button"
                  onClick={async () => {
                    if (zipInput && !selectedZips.some(zip => (typeof zip === 'string' ? zip : zip.zip) === zipInput)) {
                      const zipWithGeometry = await addZipCodeWithGeometry(zipInput);
                      setSelectedZips(prev => [...prev, zipWithGeometry]);
                      setZipInput("");
                    }
                  }}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add
                </button>
                {selectedZips.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedZips([]);
                      // Also clear any drawn boundaries
                      if (window.mapInstance && window.drawnItems) {
                        window.drawnItems.clearLayers();
                      }
                      setBoundary(null);
                    }}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {/* Line 2: Selected Zip Code Badges */}
              {selectedZips.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center', 
                  marginBottom: '10px', 
                  flexWrap: 'wrap',
                  width: '100%'
                }}>
                  {selectedZips.slice(0, showAllZips ? selectedZips.length : 3).map((zip, index) => {
                    const zipCode = typeof zip === 'string' ? zip : zip.zip;
                    return (
                      <div key={zipCode} style={{
                        background: 'rgba(0, 255, 157, 0.2)',
                        border: '1px solid #00ff9d',
                        color: '#00ff9d',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {zipCode}
                        <button
                          onClick={() => setSelectedZips(prev => prev.filter(z => (typeof z === 'string' ? z : z.zip) !== zipCode))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00ff9d',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '14px',
                            lineHeight: '1'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  
                  {selectedZips.length > 3 && !showAllZips && (
                    <button
                      type="button"
                      onClick={() => setShowAllZips(true)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      +{selectedZips.length - 3} more
                    </button>
                  )}
                  
                  {selectedZips.length > 3 && showAllZips && (
                    <button
                      type="button"
                      onClick={() => setShowAllZips(false)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
              
              {/* Line 3: Show Map Button */}
              <button 
                type="button"
                onClick={() => setShowMap(!showMap)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: showMap ? '#00ff9d' : 'rgba(255, 255, 255, 0.1)',
                  color: showMap ? '#000000' : '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
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
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
            >
              Search Properties
            </button>
          </form>
          </div>
        
          {/* Map Container - shows on right side for desktop */}
          {showMap && (
            <div className="map-container" style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '0',
              backdropFilter: 'blur(20px)',
              height: 'calc(100% + 25px)',
              position: 'relative',
              overflow: 'hidden',
              alignSelf: 'stretch',
              marginTop: '-25px'
            }}>
              <MapContainer
                center={[35.2271, -80.8431]}
                zoom={10}
                style={{ height: "100%", width: "100%", borderRadius: '20px' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
                <MapSearchControl setIsDrawing={setIsDrawing} />
                <ZipPolygons selectedZips={selectedZips} />
                <FeatureGroup>{<DrawBoundary onBoundaryDrawn={setBoundary} onZipCodesFound={handleZipCodesFound} onClearDrawing={handleClearDrawing} setIsDrawing={setIsDrawing} />}</FeatureGroup>
              </MapContainer>
            
            {/* Zoom Controls - positioned after address search */}
            <div style={{ position: 'absolute', top: '60px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
            
            {/* Drawing Tools - positioned below zoom controls */}
            <div style={{ position: 'absolute', top: '140px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
        )}
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
