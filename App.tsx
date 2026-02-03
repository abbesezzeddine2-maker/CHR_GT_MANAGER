import React, { useState, useEffect } from 'react';
import { Menu, Locate, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ClientSheet from './components/ClientSheet';
import { parseCSV } from './utils/csvHelper';
import { GOOGLE_SHEET_URL } from './utils/config';
import { Client } from './types';

function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [triggerLocate, setTriggerLocate] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    if (!GOOGLE_SHEET_URL) {
      setErrorMsg("L'URL Google Sheet n'est pas configurée.");
      setIsLoading(false);
      return;
    }

    try {
      let text = '';
      
      // Tentative 1 : Direct
      try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (response.ok) {
           text = await response.text();
        }
      } catch (e) {
        console.warn("Échec chargement direct, passage au proxy...");
      }

      // Tentative 2 : Proxy
      if (!text || text.length < 50) {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(GOOGLE_SHEET_URL)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Erreur chargement via proxy");
        text = await response.text();
      }

      const parsedClients = parseCSV(text);
      setClients(parsedClients);
      setIsOfflineMode(false);
      
      localStorage.setItem('chr_gt_clients', JSON.stringify(parsedClients));

    } catch (error: any) {
      console.error("Erreur de chargement:", error);
      
      // Fallback Cache
      const cachedData = localStorage.getItem('chr_gt_clients');
      if (cachedData) {
        try {
          setClients(JSON.parse(cachedData));
          setIsOfflineMode(true);
        } catch (e) {
          setErrorMsg("Impossible de charger les données (Erreur réseau + Cache vide).");
        }
      } else {
        setErrorMsg("Impossible de charger les données (Vérifiez votre connexion).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
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

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-4 text-slate-100 p-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="animate-pulse text-sm font-medium">Chargement des données...</p>
      </div>
    );
  }

  if (errorMsg && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-6 p-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-full">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <p className="text-slate-400 text-sm">{errorMsg}</p>
        <button 
          onClick={loadData}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen w-screen bg-slate-950 overflow-hidden relative">
      
      {isOfflineMode && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-orange-600/90 text-white text-xs py-1 px-2 flex justify-center items-center gap-2 backdrop-blur-sm shadow-md">
          <WifiOff size={12} />
          <span>Mode Hors-ligne</span>
        </div>
      )}

      {/* Bouton Menu Mobile Uniquement */}
      <div className={`md:hidden absolute left-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Bouton Localisation */}
      <div className={`absolute right-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={handleLocateMe}
          className="bg-slate-900 text-indigo-400 p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
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

      {/* Main Content Area */}
      <div className="flex-1 relative h-full bg-slate-900 w-full overflow-hidden">
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