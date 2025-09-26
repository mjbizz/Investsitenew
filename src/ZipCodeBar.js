import React, { useState, useEffect, useRef } from "react";

// Load Charlotte zip polygons once
let ncZipData = null;
async function fetchNCZipData() {
  if (ncZipData) return ncZipData;
  const url = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nc_north_carolina_zip_codes_geo.min.json";
  const res = await fetch(url);
  ncZipData = await res.json();
  return ncZipData;
}

async function fetchZipGeoJson(zip) {
  const data = await fetchNCZipData();
  // Normalize both to 5-digit zero-padded strings
  const norm = z => (z + '').trim().padStart(5, '0');
  const feature = data.features.find(f => norm(f.properties.ZCTA5CE10 || f.properties.zip) === norm(zip));
  return feature || null;
}

export default function ZipCodeBar({ selectedZips, setSelectedZips, zipInput, setZipInput, showAllZips, setShowAllZips }) {
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Focus input on mobile when component mounts
  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isMobile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const zip = zipInput.trim();
    
    // Clear any previous error
    setErrorMessage("");
    
    if (!zip || selectedZips.some(z => (typeof z === 'string' ? z : z.zip) === zip)) {
      return;
    }
    
    // Show loading state
    setZipInput('Adding...');
    
    try {
      const geojson = await fetchZipGeoJson(zip);
      
      if (geojson === null) {
        // Zip code doesn't exist
        setErrorMessage("Zip code invalid");
        setZipInput(zip); // Restore the zip code
        // Clear error after 3 seconds
        setTimeout(() => setErrorMessage(""), 3000);
      } else {
        // Valid zip code
        setSelectedZips(zips => [...zips, { zip, geojson, notfound: false }]);
        setZipInput("");
        
        // Refocus input on mobile after submission
        if (isMobile && inputRef.current) {
          setTimeout(() => inputRef.current.focus(), 100);
        }
      }
    } catch (err) {
      console.error('Error fetching zip geojson:', err);
      setErrorMessage("Error validating zip code");
      setZipInput(zip); // Restore the zip code if there was an error
      // Clear error after 3 seconds
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className="zip-search-container" style={{ width: 'auto' }}>
      <div className="search-row-2">
        <div className="zip-input-section">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="zip-input-wrapper">
              <button 
                type="submit" 
                className="add-zip-button"
                disabled={!zipInput.trim() || zipInput.length !== 5 || zipInput === 'Adding...'}
                aria-label="Add zip code"
              >
                Add
              </button>
              <input
                ref={inputRef}
                type={isMobile ? "number" : "text"}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Zip code"
                value={zipInput}
                onChange={e => {
                  setZipInput(e.target.value.replace(/[^\d]/g, "").slice(0, 5));
                  // Clear error when user starts typing
                  if (errorMessage) setErrorMessage("");
                }}
                className="zip-input-field"
                aria-label="Enter zip code"
              />
              {isMobile && zipInput && (
                <button 
                  type="button" 
                  className="clear-zip-button"
                  onClick={() => {
                    setZipInput("");
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Error message */}
            {errorMessage && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {errorMessage}
              </div>
            )}
            
          </form>
          
          {/* Selected Zip Codes Display - Right below the form */}
          {selectedZips.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px', 
              marginTop: '8px',
              alignItems: 'flex-end',
              width: '100%'
            }}>
              {(showAllZips ? selectedZips : selectedZips.slice(0, 3)).map((zip, index) => (
                <div
                  key={typeof zip === 'string' ? zip : zip.zip}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '90px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    position: 'relative'
                  }}
                >
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span>{typeof zip === 'string' ? zip : zip.zip}</span>
                  </div>
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
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '0',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      touchAction: 'manipulation'
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
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '90px',
                    height: '24px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
        
        <div className="zip-results-section">
          {/* Zip results now handled in App.js */}
        </div>
      </div>
    </div>
  );
}
