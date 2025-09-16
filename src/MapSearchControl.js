import { useEffect } from "react";
import L from "leaflet";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

export default function MapSearchControl({ map }) {
  useEffect(() => {
    if (!map) return;
    if (!L.Control.Geocoder) return;
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: "Search location...",
      geocoder: L.Control.Geocoder.nominatim(),
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
