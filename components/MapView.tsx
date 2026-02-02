import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Client } from '../types';

// Dynamic Marker Generator based on Division
const getMarkerIcon = (division: string | undefined, isSelected: boolean) => {
  let color = '#6366f1'; // Default Indigo-500
  
  // Specific color logic
  if (division === 'O152') color = '#ef4444'; // Red-500
  if (division === 'Y150') color = '#3b82f6'; // Blue-500

  // Styles
  const size = isSelected ? 20 : 12;
  const border = isSelected ? 3 : 2;
  const shadow = isSelected 
    ? `0 0 0 4px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0,0,0,0.5)`
    : `0 2px 4px rgba(0,0,0,0.5)`;

  return L.divIcon({
    className: isSelected ? 'custom-div-icon-selected' : 'custom-div-icon',
    html: `<div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: ${border}px solid white; 
      box-shadow: ${shadow};
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size]
  });
};

// Component to handle map center updates
const MapController = ({ 
  center, 
  zoom 
}: { 
  center: [number, number] | null; 
  zoom: number 
}) => {
  const map = useMap();
  useEffect(() => {
    // Only fly if coordinates are valid finite numbers
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      try {
        map.flyTo(center, zoom, {
          duration: 1.5
        });
      } catch (e) {
        console.error("Leaflet FlyTo Error:", e);
      }
    }
  }, [center, zoom, map]);
  return null;
};

// Component to locate user
const LocationMarker = ({ setLocation }: { setLocation: (pos: [number, number]) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      if (e && e.latlng) {
        setLocation([e.latlng.lat, e.latlng.lng]);
        map.flyTo(e.latlng, map.getZoom());
      }
    });
  }, [map, setLocation]);

  return null;
};

interface MapViewProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  userLocation: [number, number] | null;
  setUserLocation: (pos: [number, number]) => void;
  triggerLocate: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  clients, 
  selectedClient, 
  onSelectClient,
  userLocation,
  setUserLocation,
  triggerLocate
}) => {
  // Center on France by default
  const defaultCenter: [number, number] = [46.603354, 1.888334];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState(6);

  useEffect(() => {
    if (selectedClient && Number.isFinite(selectedClient.lat) && Number.isFinite(selectedClient.lng)) {
      setMapCenter([selectedClient.lat, selectedClient.lng]);
      setZoom(15);
    } else if (userLocation && Number.isFinite(userLocation[0]) && Number.isFinite(userLocation[1])) {
      setMapCenter(userLocation);
      setZoom(13);
    }
  }, [selectedClient, userLocation]);

  return (
    <div className="h-full w-full z-0 relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={mapCenter} zoom={zoom} />
        
        {triggerLocate && <LocationMarker setLocation={setUserLocation} />}

        {userLocation && Number.isFinite(userLocation[0]) && Number.isFinite(userLocation[1]) && (
          <Marker position={userLocation} icon={L.divIcon({
            className: 'user-loc',
            html: `<div class="flex justify-center items-center w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}>
            <Popup>Votre position</Popup>
          </Marker>
        )}

        {clients.map(client => {
          // Double check to prevent NaN crash
          if (!Number.isFinite(client.lat) || !Number.isFinite(client.lng)) return null;
          
          return (
            <Marker
              key={client.id}
              position={[client.lat, client.lng]}
              icon={getMarkerIcon(client.division, selectedClient?.id === client.id)}
              eventHandlers={{
                click: () => onSelectClient(client),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;