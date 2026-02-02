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
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('');

  const appendLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => prev + '\n' + msg);
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setDebugLog('Démarrage synchronisation...');

    if (!GOOGLE_SHEET_URL) {
      setErrorMsg("L'URL Google Sheet n'est pas configurée.");
      setIsLoading(false);
      return;
    }

    try {
      let text = '';
      let fetchSuccess = false;
      
      // STRATÉGIE 1 : Direct (Fonctionne si CORS est permissif)
      if (!fetchSuccess) {
        try {
          appendLog("Tentative 1: Direct...");
          const response = await fetch(GOOGLE_SHEET_URL, { cache: 'no-store' });
          if (response.ok) {
             text = await response.text();
             if (text && text.length > 50) fetchSuccess = true;
          }
        } catch (e) {
          appendLog(`Echec tentative 1: ${e}`);
        }
      }

      // STRATÉGIE 2 : CorsProxy.io (Très robuste)
      if (!fetchSuccess) {
        try {
          appendLog("Tentative 2: CorsProxy.io...");
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(GOOGLE_SHEET_URL)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            text = await response.text();
            if (text && text.length > 50) fetchSuccess = true;
          } else {
             appendLog(`Proxy erreur status: ${response.status}`);
          }
        } catch (e) {
          appendLog(`Echec tentative 2: ${e}`);
        }
      }

      // STRATÉGIE 3 : AllOrigins (JSONP style fallback)
      if (!fetchSuccess) {
        try {
          appendLog("Tentative 3: AllOrigins...");
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(GOOGLE_SHEET_URL)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const json = await response.json();
            if (json.contents) {
              text = json.contents;
              fetchSuccess = true;
            }
          }
        } catch (e) {
          appendLog(`Echec tentative 3: ${e}`);
        }
      }

      if (!fetchSuccess || !text) {
        throw new Error("Impossible de télécharger le fichier via aucune méthode.");
      }
      
      appendLog("Fichier téléchargé. Analyse CSV...");
      const parsedClients = parseCSV(text);
      
      if (parsedClients.length === 0) {
        throw new Error("Fichier vide ou format de colonnes incorrect (Vérifiez: Division, Magasin, Code Client, Latitude, Longitude).");
      }

      setClients(parsedClients);
      setIsOfflineMode(false);
      
      const timestamp = new Date().toLocaleString('fr-FR');
      localStorage.setItem('chr_gt_clients', JSON.stringify(parsedClients));
      localStorage.setItem('chr_gt_date', timestamp);
      setLastUpdated(timestamp);
      
      appendLog(`${parsedClients.length} clients chargés.`);

    } catch (error: any) {
      appendLog(`ERREUR CRITIQUE: ${error.message}`);
      
      const cachedData = localStorage.getItem('chr_gt_clients');
      const cachedDate = localStorage.getItem('chr_gt_date');
      
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          setClients(parsedCache);
          setLastUpdated(cachedDate);
          setIsOfflineMode(true);
          appendLog("Passage en mode hors-ligne (cache utilisé).");
        } catch (e) {
          setErrorMsg("Données en cache corrompues.");
        }
      } else {
        setErrorMsg("Impossible de récupérer les données.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // SW Update logic with error silencing for preview envs
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.');
                }
              });
            }
          });
        })
        .catch(() => {
          // Silently ignore SW errors (common in strict origin preview environments)
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

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-4 text-slate-100 p-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="animate-pulse text-sm font-medium">Synchronisation des données...</p>
        <pre className="text-[10px] text-slate-500 max-w-sm overflow-hidden text-center whitespace-pre-wrap">{debugLog.slice(-200)}</pre>
      </div>
    );
  }

  if (errorMsg && clients.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center flex-col gap-6 p-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-full">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <div className="max-w-md w-full">
          <h1 className="text-xl font-bold text-white mb-2">Erreur de connexion</h1>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          
          <div className="bg-slate-900 p-4 rounded-lg mb-6 text-left border border-slate-800">
             <p className="text-xs text-slate-500 font-mono mb-2 border-b border-slate-800 pb-1">JOURNAL DE DEBUG:</p>
             <pre className="text-[10px] text-red-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-32">
               {debugLog}
             </pre>
          </div>

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
      
      {isOfflineMode && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-orange-600/90 text-white text-xs py-1 px-2 flex justify-center items-center gap-2 backdrop-blur-sm shadow-md">
          <WifiOff size={12} />
          <span>Mode Hors-ligne • Données du {lastUpdated || '?'}</span>
          <button onClick={loadData} className="ml-2 p-1 bg-black/20 rounded hover:bg-black/40" title="Réessayer">
            <RefreshCw size={10} />
          </button>
        </div>
      )}

      <div className={`md:hidden absolute left-4 z-[500] transition-all duration-300 ${isOfflineMode ? 'top-10' : 'top-4'}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

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
