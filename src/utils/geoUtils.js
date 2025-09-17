// Utility functions for geographic operations

// Check if a point is inside a polygon using ray casting algorithm
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Check if two polygons intersect (simplified check)
function polygonsIntersect(poly1, poly2) {
  // Check if any point of poly1 is inside poly2
  for (const point of poly1) {
    if (pointInPolygon(point, poly2)) {
      return true;
    }
  }
  
  // Check if any point of poly2 is inside poly1
  for (const point of poly2) {
    if (pointInPolygon(point, poly1)) {
      return true;
    }
  }
  
  return false;
}

// Get coordinates from GeoJSON geometry
function getCoordinatesFromGeometry(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0]; // First ring (exterior)
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates[0][0]; // First polygon, first ring
  }
  return [];
}

// Find zip codes that intersect with a drawn polygon
export async function findIntersectingZipCodes(drawnPolygon) {
  try {
    console.log('Loading NC zip data...');
    // Load NC zip data
    const url = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nc_north_carolina_zip_codes_geo.min.json";
    const response = await fetch(url);
    const zipData = await response.json();
    console.log('Loaded zip data, features count:', zipData.features.length);
    
    // Convert drawn polygon coordinates (GeoJSON format is [lng, lat])
    const drawnCoords = drawnPolygon.geometry.coordinates[0];
    console.log('Drawn polygon coordinates:', drawnCoords);
    
    const intersectingZips = [];
    
    for (const feature of zipData.features) {
      const zipCode = feature.properties.ZCTA5CE10 || feature.properties.zip;
      if (!zipCode) continue;
      
      const zipCoords = getCoordinatesFromGeometry(feature.geometry);
      if (zipCoords.length === 0) continue;
      
      // Check if polygons intersect
      if (polygonsIntersect(drawnCoords, zipCoords)) {
        console.log('Found intersecting zip:', zipCode);
        intersectingZips.push({
          zip: zipCode.toString().padStart(5, '0'),
          geojson: feature,
          notfound: false
        });
      }
    }
    
    console.log('Total intersecting zips found:', intersectingZips.length);
    return intersectingZips;
  } catch (error) {
    console.error('Error finding intersecting zip codes:', error);
    return [];
  }
}
