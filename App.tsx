import React, { useState, useEffect } from 'react';
import { Menu, Locate, WifiOff, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Nouveaux états pour le chargement et les erreurs
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
      
      try {
        // Tentative 1 : Chargement direct (peut échouer à cause de CORS sur Vercel)
        console.log("Tentative de chargement direct...");
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) throw new Error('Erreur réseau directe');
        text = await response.text();
      } catch (directError) {
        // Tentative 2 : Utilisation d'un proxy pour contourner les restrictions CORS
        console.warn("Échec direct, tentative via proxy...", directError);
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(GOOGLE_SHEET_URL)}&cb=${Date.now()}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Erreur réseau proxy');
        text = await response.text();
      }
      
      const parsedClients = parseCSV(text);
      
      if (parsedClients.length === 0) {
        throw new Error("Le fichier a été téléchargé mais ne contient aucun client valide. Vérifiez le format des colonnes.");
      }

      setClients(parsedClients);
      setIsOfflineMode(false);
      
      // Sauvegarde pour le mode hors-ligne
      const timestamp = new Date().toLocaleString('fr-FR');
      localStorage.setItem('chr_gt_clients', JSON.stringify(parsedClients));
      localStorage.setItem('chr_gt_date', timestamp);
      setLastUpdated(timestamp);
      
      console.log(`${parsedClients.length} clients chargés avec succès.`);

    } catch (error) {
      console.error("Erreur globale de chargement:", error);
      
      // Tentative de récupération depuis le cache local (Mode Hors-ligne)
      const cachedData = localStorage.getItem('chr_gt_clients');
      const cachedDate = localStorage.getItem('chr_gt_date');
      
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          setClients(parsedCache);
          setLastUpdated(cachedDate);
          setIsOfflineMode(true);
          console.log("Données chargées depuis le cache.");
        } catch (e) {
          setErrorMsg("Erreur lors de la lecture des données sauvegardées.");
        }
      } else {
        // Aucune donnée nulle part
        setErrorMsg("Impossible de récupérer les données. Vérifiez votre connexion internet ou l'URL du fichier.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW fail', err));
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

  // Écran de chargement initial
  if (isLoading && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-4 text-slate-100">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="animate-pulse text-sm font-medium">Synchronisation des données...</p>
      </div>
    );
  }

  // Écran d'erreur bloquant (si pas de cache et pas de réseau)
  if (errorMsg && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-6 p-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-full">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <div className="max-w-xs">
          <h1 className="text-xl font-bold text-white mb-2">Erreur de connexion</h1>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <button 
            onClick={loadData}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative">
      
      {/* Offline / Info Banner */}
      {isOfflineMode && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-orange-600/90 text-white text-xs py-1 px-2 flex justify-center items-center gap-2 backdrop-blur-sm shadow-md">
          <WifiOff size={12} />
          <span>Mode Hors-ligne • Données du {lastUpdated || '?'}</span>
          <button onClick={loadData} className="ml-2 p-1 bg-black/20 rounded hover:bg-black/40" title="Réessayer la connexion">
            <RefreshCw size={10} />
          </button>
        </div>
      )}

      {/* Mobile Header Button */}
      <div className={`md:hidden absolute left-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Locate Button */}
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
