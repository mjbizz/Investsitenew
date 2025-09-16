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
import "./App.css";

function MapSearchControl() {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !window.L.Control.Geocoder) return;
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

function DrawBoundary({ onBoundaryDrawn }) {
  const map = useMapEvents({
    click() {},
  });
  React.useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
      edit: false, // Remove layers edit button
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, function (e) {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      onBoundaryDrawn(e.layer.toGeoJSON());
    });
    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
    // eslint-disable-next-line
  }, []);
  return null;
}



function App() {
  const [zipInput, setZipInput] = useState("");
  const [selectedZips, setSelectedZips] = useState([]); // [{zip, geojson, bounds}]
  const [budget, setBudget] = useState("");
  const [risk, setRisk] = useState("medium");
  const [boundary, setBoundary] = useState(null);
  const [showResults, setShowResults] = useState(false);


  const handleSubmit = (e) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <div className="main-container">
      <header>
        <h1>Find the Best Investment Properties</h1>
        <p>Draw your area of interest or enter a zip code, and tell us your investment preferences.</p>
      </header>
      <div className="content">
        <div className="map-section">
          <ZipCodeBar
            selectedZips={selectedZips}
            setSelectedZips={setSelectedZips}
            zipInput={zipInput}
            setZipInput={setZipInput}
          />
          <MapContainer center={[35.2271, -80.8431]} zoom={10} style={{ height: "350px", width: "100%", borderRadius: 8 }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>" />
            <MapSearchControl />
            <ZipPolygons selectedZips={selectedZips} />
            <FeatureGroup>{<DrawBoundary onBoundaryDrawn={setBoundary} />}</FeatureGroup>
          </MapContainer>
        </div>
        <form className="prefs-form" onSubmit={handleSubmit}>
          <label>
            Budget ($):
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              placeholder="e.g. 500000"
              required
            />
          </label>
          <label>
            Risk Tolerance:
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Investment Horizon (years):
            <input type="number" min="1" max="30" placeholder="e.g. 5" />
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
          <button type="submit">Find Properties</button>
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
