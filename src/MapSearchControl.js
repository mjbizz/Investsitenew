import { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";
import "leaflet-draw/dist/leaflet.draw.css";

export default function MapSearchControl({ onDrawCreated }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const map = useMapEvents({
    click() {}
  });
  
  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (!map) return;
    
    // Initialize geocoder
    let geocoder;
    if (L.Control.Geocoder) {
      geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Search location...",
        geocoder: L.Control.Geocoder.nominatim(),
        suggestMinLength: 3,
        suggestTimeout: 250,
        queryMinLength: 1,
        position: 'topleft',
        errorMessage: 'Nothing found.'
      })
      .on("markgeocode", function (e) {
        const bbox = e.geocode.bbox;
        const bounds = L.latLngBounds([
          [bbox.getSouth(), bbox.getWest()],
          [bbox.getNorth(), bbox.getEast()],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      });
      
      geocoder.addTo(map);
    }
    
    // Initialize draw control
    let drawControl;
    if (L.Draw) {
      const drawOptions = {
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2
            },
            icon: new L.DivIcon({
              iconSize: new L.Point(10, 10),
              className: 'leaflet-div-icon leaflet-editing-icon'
            })
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: new L.FeatureGroup(),
          remove: true
        }
      };
      
      // For mobile, use a custom draw button instead of the full control
      if (isMobile) {
        const drawButton = L.easyButton({
          position: 'topright',
          states: [{
            stateName: 'draw-polygon',
            icon: '<i class="fas fa-draw-polygon"></i>',
            title: 'Draw area',
            onClick: (btn) => {
              // Remove any existing draw control
              if (window.drawControl) {
                map.removeControl(window.drawControl);
              }
              
              // Create new draw control with just polygon
              const drawControl = new L.Control.Draw({
                ...drawOptions,
                draw: {
                  ...drawOptions.draw,
                  polygon: {
                    ...drawOptions.draw.polygon,
                    showArea: true,
                    metric: true
                  }
                }
              });
              
              // Store reference to remove later
              window.drawControl = drawControl;
              map.addControl(drawControl);
              
              // Auto-start drawing
              setTimeout(() => {
                const drawPolygon = document.querySelector('.leaflet-draw-draw-polygon');
                if (drawPolygon) drawPolygon.click();
              }, 100);
              
              // Handle draw events
              map.on(L.Draw.Event.CREATED, function(e) {
                if (onDrawCreated) {
                  onDrawCreated(e.layer.toGeoJSON());
                }
                // Remove the draw control after drawing
                if (window.drawControl) {
                  map.removeControl(window.drawControl);
                  window.drawControl = null;
                }
              });
              
              // Handle cancel
              map.on('draw:drawstop', function() {
                if (window.drawControl) {
                  map.removeControl(window.drawControl);
                  window.drawControl = null;
                }
              });
              
              // Change button state
              btn.state('cancel-draw');
            }
          }, {
            stateName: 'cancel-draw',
            icon: '<i class="fas fa-times"></i>',
            title: 'Cancel drawing',
            onClick: (btn) => {
              // Cancel any active drawing
              if (map.pm) {
                map.pm.disableDraw();
              }
              // Remove draw control
              if (window.drawControl) {
                map.removeControl(window.drawControl);
                window.drawControl = null;
              }
              // Reset button
              btn.state('draw-polygon');
            }
          }]
        });
        
        // Add button to map
        drawButton.addTo(map);
        
        // Style the button for mobile
        const button = document.querySelector('.easy-button-button');
        if (button) {
          button.style.width = '40px';
          button.style.height = '40px';
          button.style.fontSize = '18px';
          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
          button.style.backgroundColor = 'white';
          button.style.borderRadius = '4px';
          button.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
          button.style.margin = '10px';
          button.style.cursor = 'pointer';
          button.style.zIndex = '1000';
        }
      } else {
        // For desktop, use the full draw control
        drawControl = new L.Control.Draw(drawOptions);
        map.addControl(drawControl);
        
        // Handle draw events
        map.on(L.Draw.Event.CREATED, function(e) {
          if (onDrawCreated) {
            onDrawCreated(e.layer.toGeoJSON());
          }
        });
      }
    }
    
    return () => {
      // Cleanup
      if (geocoder) {
        map.removeControl(geocoder);
      }
      if (drawControl) {
        map.removeControl(drawControl);
      }
      if (window.drawControl) {
        map.removeControl(window.drawControl);
        window.drawControl = null;
      }
    };
  }, [map, isMobile, onDrawCreated]);
  
  return null;
}
