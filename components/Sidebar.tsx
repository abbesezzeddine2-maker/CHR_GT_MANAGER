import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { Client } from '../types';

interface SidebarProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  selectedClientId: string | undefined;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  clients, 
  onSelectClient, 
  selectedClientId,
  isOpen,
  onCloseMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Reset selected store when division changes
  useEffect(() => {
    setSelectedStore('all');
  }, [selectedDivision]);

  // Extract unique divisions
  const divisions = useMemo(() => {
    const uniqueDivs = new Set(clients.map(c => c.division).filter(d => d && d.trim() !== ''));
    return Array.from(uniqueDivs).sort();
  }, [clients]);

  // Extract unique stores (filtered by selected division)
  const availableStores = useMemo(() => {
    let relevantClients = clients;
    if (selectedDivision !== 'all') {
      relevantClients = clients.filter(c => c.division === selectedDivision);
    }
    const uniqueStores = new Set(relevantClients.map(c => c.store).filter(s => s && s.trim() !== ''));
    return Array.from(uniqueStores).sort();
  }, [clients, selectedDivision]);

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDivision = selectedDivision === 'all' || c.division === selectedDivision;
    const matchesStore = selectedStore === 'all' || c.store === selectedStore;

    return matchesSearch && matchesDivision && matchesStore;
  });

  return (
    <div className={`
      fixed inset-y-0 left-0 z-20 w-80 bg-slate-900 border-r border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 flex flex-col
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
           {/* Double Logo Integration: Ben Yedder & Bondin - Using Thumbnail Endpoint for Reliability */}
           <div className="flex items-center gap-3">
             {/* Ben Yedder Logo */}
             <img 
                src="https://drive.google.com/thumbnail?id=1WLnyAQ0Y2Hv88COFP_0nOpnPnj5s0TfY&sz=w500" 
                alt="Ben Yedder" 
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
             />
             {/* Bondin Logo */}
             <img 
                src="https://drive.google.com/thumbnail?id=1vXFeon3UtAJgky8hX7Z9gRGKIBbngxnR&sz=w500" 
                alt="Bondin" 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
             />
           </div>
           
           {/* Vertical Separator */}
           <div className="h-8 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <div>
            <h1 className="text-xl font-bold text-slate-100">
              CHR_GT
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">{clients.length} CLIENTS</p>
          </div>
        </div>
        <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Tools Section */}
      <div className="flex-shrink-0 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex flex-col gap-2 pb-3">
        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher client, ville..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none border"
            />
          </div>
        </div>

        {/* Filters Container */}
        <div className="flex flex-col gap-2 px-4">
          
          {/* Division Filter */}
          {divisions.length > 0 && (
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Div</span>
                <button
                  onClick={() => setSelectedDivision('all')}
                  className={`
                    whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors border flex-shrink-0
                    ${selectedDivision === 'all' 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}
                  `}
                >
                  Tout
                </button>
                {divisions.map(div => (
                  <button
                    key={div}
                    onClick={() => setSelectedDivision(div)}
                    className={`
                      whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors border flex-shrink-0
                      ${selectedDivision === div 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}
                    `}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Store Filter */}
          {availableStores.length > 0 && (
            <div className="overflow-x-auto no-scrollbar">
               <div className="flex gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Mag</span>
                <button
                  onClick={() => setSelectedStore('all')}
                  className={`
                    whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors border flex-shrink-0
                    ${selectedStore === 'all' 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}
                  `}
                >
                  Tout
                </button>
                {availableStores.map(store => (
                  <button
                    key={store}
                    onClick={() => setSelectedStore(store)}
                    className={`
                      whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors border flex-shrink-0
                      ${selectedStore === store 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}
                    `}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Aucun client trouvé.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`
                  w-full text-left p-4 hover:bg-slate-800/50 transition-colors flex items-center gap-4
                  ${selectedClientId === client.id ? 'bg-slate-800 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}
                `}
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                   {client.logo ? (
                      <img src={client.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                   ) : (
                      <div className="w-full h-full bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                         <ImageIcon size={20} className="text-slate-600" />
                      </div>
                   )}
                </div>
                <div className="min-w-0">
                  <h3 className={`font-medium truncate ${selectedClientId === client.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {client.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="truncate">{client.city}</span>
                    <span className="flex-shrink-0">•</span>
                    <span className="truncate text-slate-400">{client.store}</span>
                  </div>
                </div>
                <ChevronRight size={16} className={`ml-auto flex-shrink-0 ${selectedClientId === client.id ? 'text-indigo-500' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;