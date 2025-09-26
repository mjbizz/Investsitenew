import { useEffect } from "react";
import { GeoJSON, useMap } from "react-leaflet";

export default function ZipPolygons({ selectedZips }) {
  const map = useMap();

  // Convert selectedZips to objects if they're strings
  const zipObjects = selectedZips.map(z => 
    typeof z === 'string' ? { zip: z, geojson: null, notfound: true } : z
  );

  // Fit bounds to all zip polygons when they change
  useEffect(() => {
    try {
      const validGeojsons = zipObjects
        .map(z => z.geojson)
        .filter(Boolean);
        
      if (validGeojsons.length > 0) {
        // Calculate the overall bounding box
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        
        validGeojsons.forEach(geojson => {
          if (!geojson || !geojson.geometry || !geojson.geometry.coordinates) {
            console.warn('Invalid geojson structure:', geojson);
            return;
          }
          
          let coords;
          if (geojson.geometry.type === 'Polygon') {
            coords = geojson.geometry.coordinates[0];
          } else if (geojson.geometry.type === 'MultiPolygon') {
            coords = geojson.geometry.coordinates[0][0];
          } else {
            console.warn('Unsupported geometry type:', geojson.geometry.type);
            return;
          }
          
          if (!Array.isArray(coords)) {
            console.warn('Invalid coordinates structure:', coords);
            return;
          }
          
          coords.forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
              const [lng, lat] = coord;
              if (typeof lng === 'number' && typeof lat === 'number') {
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              }
            }
          });
        });
        
        // Only fit bounds if we have valid coordinates
        if (minLat !== Infinity && maxLat !== -Infinity && minLng !== Infinity && maxLng !== -Infinity) {
          map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);
        }
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [zipObjects, map]);

  return (
    <>
      {zipObjects.map(({ zip, geojson }) =>
        geojson ? (
          <GeoJSON key={zip} data={geojson} style={{ color: '#3b82f6', weight: 2, fillOpacity: 0.2 }} />
        ) : null
      )}
    </>
  );
}
