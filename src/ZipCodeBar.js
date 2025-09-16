import React from "react";

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

export default function ZipCodeBar({ selectedZips, setSelectedZips, zipInput, setZipInput }) {
  return (
    <div className="zip-search-bar">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const zip = zipInput.trim();
          if (!zip || selectedZips.some(z => z.zip === zip)) return;
          let geojson = null;
          try {
            geojson = await fetchZipGeoJson(zip);
          } catch (err) {
            console.error('Error fetching zip geojson:', err);
          }
          // Only mark as notfound if geojson is null (no bbox at all)
          setSelectedZips(zips => [...zips, { zip, geojson, notfound: geojson === null }]);
          setZipInput("");
        }}
        autoComplete="off"
      >
        <input
          type="text"
          placeholder="Add zip code"
          value={zipInput}
          onChange={e => setZipInput(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
          className="zip-input-compact"
          style={{ width: 90 }}
        />
      </form>
      <div className="zip-chips">
        {selectedZips.map(({ zip, notfound }) => (
          <span className={"zip-chip" + (notfound ? " zip-chip-notfound" : "")} key={zip}>
            {zip}{notfound ? <span style={{color:'#e11d48',marginLeft:3}} title="Boundary not found">!</span> : null}
            <button
              type="button"
              className="zip-chip-x"
              onClick={() => setSelectedZips(zips => zips.filter(z => z.zip !== zip))}
              aria-label={`Remove ${zip}`}
            >×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
