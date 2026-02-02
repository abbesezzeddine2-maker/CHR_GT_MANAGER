import React, { useState, useEffect } from 'react';
import { Menu, Locate, WifiOff, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ClientSheet from './components/ClientSheet';
import { parseCSV } from './utils/csvHelper';
import { GOOGLE_SHEET_ID } from './utils/config';
import { Client } from './types';

function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [triggerLocate, setTriggerLocate] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = async () => {
    if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID.includes('VOTRE_ID')) {
      console.warn("GOOGLE_SHEET_ID non configuré");
      return;
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

    try {
      // 1. Try to fetch fresh data
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const text = await response.text();
      const parsedClients = parseCSV(text);
      
      setClients(parsedClients);
      setIsOfflineMode(false);
      
      // 2. Save to LocalStorage for offline use
      const timestamp = new Date().toLocaleString();
      localStorage.setItem('chr_gt_clients', JSON.stringify(parsedClients));
      localStorage.setItem('chr_gt_date', timestamp);
      setLastUpdated(timestamp);
      
      console.log("Données mises à jour et sauvegardées.");

    } catch (error) {
      console.log("Mode Hors-ligne activé, tentative de lecture du cache...");
      
      // 3. Fallback to LocalStorage
      const cachedData = localStorage.getItem('chr_gt_clients');
      const cachedDate = localStorage.getItem('chr_gt_date');
      
      if (cachedData) {
        setClients(JSON.parse(cachedData));
        setLastUpdated(cachedDate);
        setIsOfflineMode(true);
      } else {
        alert("Aucune connexion et aucune donnée en cache. Veuillez vous connecter une première fois.");
      }
    }
  };

  useEffect(() => {
    loadData();
    
    // Register Service Worker for PWA Offline capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsSidebarOpen(false); 
  };

  const handleLocateMe = () => {
    setTriggerLocate(true);
    setTimeout(() => setTriggerLocate(false), 1000);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative">
      
      {/* Offline Indicator Banner */}
      {isOfflineMode && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-orange-600/90 text-white text-xs py-1 px-2 flex justify-center items-center gap-2 backdrop-blur-sm">
          <WifiOff size={12} />
          <span>Mode Hors-ligne • Données du {lastUpdated}</span>
          <button onClick={loadData} className="ml-2 p-1 bg-black/20 rounded hover:bg-black/40">
            <RefreshCw size={10} />
          </button>
        </div>
      )}

      {/* Mobile Header Overlay */}
      <div className={`md:hidden absolute left-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Floating Locate Button */}
      <div className={`absolute right-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={handleLocateMe}
          className="bg-slate-900 text-indigo-400 p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          title="Ma position"
        >
          <Locate size={24} />
        </button>
      </div>

      <Sidebar 
        clients={clients} 
        onSelectClient={handleSelectClient}
        selectedClientId={selectedClient?.id}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 relative">
        <MapView 
          clients={clients} 
          selectedClient={selectedClient} 
          onSelectClient={handleSelectClient}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          triggerLocate={triggerLocate}
        />

        <ClientSheet 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
        />
      </div>
    </div>
  );
}

export default App;