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
    const allBounds = zipObjects
      .map(z => z.geojson)
      .filter(Boolean)
      .map(geojson => {
        const coords = geojson.geometry.coordinates[0];
        return coords.map(([lng, lat]) => [lat, lng]);
      });
    if (allBounds.length > 0) {
      const flat = allBounds.flat();
      map.fitBounds(flat);
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
