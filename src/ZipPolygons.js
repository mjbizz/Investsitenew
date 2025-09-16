import { useEffect } from "react";
import { GeoJSON, useMap } from "react-leaflet";

export default function ZipPolygons({ selectedZips }) {
  const map = useMap();

  // Fit bounds to all zip polygons when they change
  useEffect(() => {
    const allBounds = selectedZips
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
  }, [selectedZips, map]);

  return (
    <>
      {selectedZips.map(({ zip, geojson }) =>
        geojson ? (
          <GeoJSON key={zip} data={geojson} style={{ color: '#7c3aed', weight: 2, fillOpacity: 0.18 }} />
        ) : null
      )}
    </>
  );
}
