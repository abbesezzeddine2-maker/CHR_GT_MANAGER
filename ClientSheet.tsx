import React from 'react';
import { X, Phone, Navigation, Calendar, DollarSign, Store, Tag } from 'lucide-react';
import { Client } from '../types';

interface ClientSheetProps {
  client: Client | null;
  onClose: () => void;
}

const ClientSheet: React.FC<ClientSheetProps> = ({ client, onClose }) => {
  if (!client) return null;

  const handleItinerary = () => {
    // Opens standard geo URI which works on mobile (Google Maps / Apple Maps)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${client.lat},${client.lng}`, '_blank');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-slate-900 md:rounded-xl shadow-2xl z-[1000] border-t md:border border-slate-700 max-h-[85vh] overflow-y-auto flex flex-col transition-all animate-in slide-in-from-bottom-5">
      
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 p-4 border-b border-slate-800 flex justify-between items-start">
        <div className="flex gap-4 w-full mr-8">
          <div className="w-16 h-16 flex-shrink-0 relative flex items-center justify-center">
             {client.logo ? (
              <img 
                src={client.logo} 
                alt="Logo" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.style.display = 'none')} 
              />
            ) : (
              <div className="w-full h-full bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shadow-lg">
                 <Store className="text-slate-600" size={32} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white leading-tight break-words">{client.name}</h2>
            <div className="flex flex-col mt-1">
              <span className="text-sm text-slate-300 font-medium">{client.city}</span>
              <span className="text-xs text-slate-500 font-mono mt-0.5">{client.code}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a 
            href={`tel:${client.phone.replace(/[^0-9+]/g, '')}`} 
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition-colors"
          >
            <Phone size={18} />
            Appeler
          </a>
          <button 
            onClick={handleItinerary}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors"
          >
            <Navigation size={18} />
            Itinéraire
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <DollarSign size={12} /> Moy. Achat/Mois
                </div>
                <div className="text-lg font-bold text-slate-100">{client.avgMonthlyPurchase || '-'}</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <DollarSign size={12} /> Moy. Achat/Liv
                </div>
                <div className="text-lg font-bold text-slate-100">{client.avgDeliveryPurchase || '-'}</div>
            </div>
        </div>

        {/* Delivery Info */}
        <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logistique</h3>
            
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-start gap-3">
                <Calendar className="text-indigo-400 mt-1" size={18} />
                <div>
                    <span className="block text-sm text-slate-200 font-medium">Jours de livraison</span>
                    <span className="block text-sm text-slate-400">{client.deliveryDays || 'Non défini'}</span>
                </div>
            </div>

            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-start gap-3">
                <Tag className="text-orange-400 mt-1" size={18} />
                <div>
                    <span className="block text-sm text-slate-200 font-medium">Gratuité Janvier 2026</span>
                    <span className="block text-sm text-slate-400">{client.freeGoodsJan26 || 'Aucune information'}</span>
                </div>
            </div>
        </div>

         <div className="text-xs text-slate-600 text-center pt-4 border-t border-slate-800/50">
            Magasin: {client.store} • Division: {client.division}
         </div>
      </div>
    </div>
  );
};

export default ClientSheet;