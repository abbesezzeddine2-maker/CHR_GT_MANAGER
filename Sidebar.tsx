import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, X, Store } from 'lucide-react';
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

  // Extract unique values for filters
  const divisions = useMemo(() => 
    Array.from(new Set(clients.map(c => c.division).filter(Boolean))), 
  [clients]);
  
  const stores = useMemo(() => 
    Array.from(new Set(clients.map(c => c.store).filter(Boolean))), 
  [clients]);

  // Filter logic
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchSearch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDiv = selectedDivision === 'all' || client.division === selectedDivision;
      const matchStore = selectedStore === 'all' || client.store === selectedStore;

      return matchSearch && matchDiv && matchStore;
    });
  }, [clients, searchQuery, selectedDivision, selectedStore]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[900] md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-[1000] w-[85vw] md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:z-10 md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-900/30 flex items-center justify-center">
                <Store className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-xl text-white tracking-tight leading-none">CHR_GT</h1>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Manager v1.5</span>
              </div>
            </div>
            <button onClick={onCloseMobile} className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Rechercher un client..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-600 transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          {(divisions.length > 0 || stores.length > 0) && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
               {divisions.length > 0 && (
                 <select 
                   value={selectedDivision}
                   onChange={(e) => setSelectedDivision(e.target.value)}
                   className="bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                 >
                   <option value="all">Toutes Divisions</option>
                   {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               )}
               {stores.length > 0 && (
                 <select 
                   value={selectedStore}
                   onChange={(e) => setSelectedStore(e.target.value)}
                   className="bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                 >
                   <option value="all">Tous Magasins</option>
                   {stores.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               )}
            </div>
          )}
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
          {filteredClients.length > 0 ? (
            <div className="divide-y divide-slate-800/50">
              {filteredClients.map(client => (
                <div 
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className={`
                    p-3 cursor-pointer transition-all hover:bg-slate-800 flex items-center gap-3 group
                    ${selectedClientId === client.id ? 'bg-slate-800 border-l-[3px] border-indigo-500' : 'border-l-[3px] border-transparent'}
                  `}
                >
                  {/* Avatar: No border, larger size */}
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm">
                    {client.logo ? (
                      <img src={client.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{client.name.substring(0,2).toUpperCase()}</span>
                    )}
                  </div>
                  
                  {/* Detailed Info Layout */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-sm font-semibold truncate ${selectedClientId === client.id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {client.name}
                      </h3>
                      <span className="text-[10px] font-mono font-medium text-indigo-300 bg-indigo-500/10 px-1.5 rounded ml-2">
                        {client.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      {client.city}
                      <span className="text-slate-700 mx-1">•</span>
                      <span className="text-slate-600">{client.division}</span>
                    </p>
                  </div>
                  
                  <ChevronRight size={16} className={`text-slate-700 transition-colors ${selectedClientId === client.id ? 'text-indigo-500' : 'group-hover:text-slate-500'}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 p-8">
              <Search size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Aucun résultat trouvé.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] text-center text-slate-600 flex justify-between px-4">
           <span>{clients.length} Clients chargés</span>
           <span>Synchro: OK</span>
        </div>
      </div>
    </>
  );
};

export default Sidebar;