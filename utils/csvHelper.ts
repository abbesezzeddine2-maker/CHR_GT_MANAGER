import { Client } from '../types';

export const extractSheetId = (url: string): string | null => {
  const match = url.match(/\/d\/(.*?)(\/|$)/);
  return match ? match[1] : null;
};

// Helper to transform Google Drive viewing links into direct image links
const sanitizeLogoUrl = (url: string): string => {
  if (!url) return '';
  
  // Clean surrounding quotes if any remain
  const cleanUrl = url.replace(/^"|"$/g, '').trim();

  // Regex to capture ID from various Google Drive/Docs URL formats
  const driveRegex = /(?:drive|docs)\.google\.com\/.*(?:id=|d\/)([a-zA-Z0-9_-]+)/;
  const match = cleanUrl.match(driveRegex);
  
  if (match && match[1]) {
    // Use thumbnail endpoint for general user-provided logos
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  
  // If no Drive ID found, return the original URL
  return cleanUrl;
};

// Robust CSV Line Parser
const parseCSVLine = (text: string): string[] => {
  // Split by comma, but ignore commas inside quotes
  const pattern = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const fields = text.split(pattern);
  
  return fields.map(field => {
    let val = field.trim();
    // Remove surrounding quotes
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    // Handle escaped quotes ("") -> (")
    return val.replace(/""/g, '"');
  });
};

export const parseCSV = (csvText: string): Client[] => {
  const lines = csvText.split(/\r?\n/); // Handle both \n and \r\n
  if (lines.length === 0) return [];

  // Parse headers using the robust parser
  const headers = parseCSVLine(lines[0]);
  
  const clients: Client[] = [];

  const getColIndex = (keywords: string[]) => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Priority 1: Exact match
    let index = normalizedHeaders.findIndex(h => keywords.some(k => h === k.toLowerCase()));
    
    // Priority 2: Starts with
    if (index === -1) {
       index = normalizedHeaders.findIndex(h => keywords.some(k => h.startsWith(k.toLowerCase())));
    }
    
    // Priority 3: Includes (restricted to longer keywords)
    if (index === -1) {
       index = normalizedHeaders.findIndex(h => keywords.some(k => k.length > 3 && h.includes(k.toLowerCase())));
    }

    return index;
  };

  // Define column mappings
  const idxMap = {
    division: getColIndex(['Division', 'Div']),
    store: getColIndex(['Magasin', 'Store', 'Depot']),
    code: getColIndex(['Code Client', 'Code', 'Client ID']),
    name: getColIndex(['Nom Client', 'Nom', 'Client']),
    city: getColIndex(['Ville', 'City', 'Commune']),
    phone: getColIndex(['Téléphone', 'Tel', 'Phone', 'Mobile']),
    days: getColIndex(['Jours de Livraison', 'Jours Liv', 'Delivery']),
    numDays: getColIndex(['Nbr Jours', 'Nb Jours', 'Freq']),
    lat: getColIndex(['Latitude', 'Lat']),
    lng: getColIndex(['Longitude', 'Long', 'Lng']),
    avgMonth: getColIndex(['Moy Achat par Mois', 'Moy Achat Mois', 'Moyenne Achat', 'CA Mensuel']),
    avgDel: getColIndex(['Moy Achat par Livraison', 'Moy Achat Liv', 'Moyenne Liv', 'Panier Moyen']),
    logo: getColIndex(['Logo', 'Image', 'Photo', 'Lien Logo', 'Url Logo', 'Picture']),
    free: getColIndex(['Gratuité', 'Gratuite', 'Free']),
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const values = parseCSVLine(line);
    
    // Helper to safely get value at index
    const getValue = (index: number) => (index !== -1 && values[index]) ? values[index] : '';

    const latStr = getValue(idxMap.lat).replace(',', '.');
    const lngStr = getValue(idxMap.lng).replace(',', '.');
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    const division = getValue(idxMap.division);

    // Determine Logo based on Division (Override logic)
    let logoUrl = sanitizeLogoUrl(getValue(idxMap.logo));
    
    // Specific brand logos based on Division ID
    // Using thumbnail endpoint (sz=w500) for reliability instead of export=view
    if (division === 'O152') {
      // Ben Yedder
      logoUrl = 'https://drive.google.com/thumbnail?id=1WLnyAQ0Y2Hv88COFP_0nOpnPnj5s0TfY&sz=w500';
    } else if (division === 'Y150') {
      // Bondin
      logoUrl = 'https://drive.google.com/thumbnail?id=1vXFeon3UtAJgky8hX7Z9gRGKIBbngxnR&sz=w500';
    }

    // Only add clients with valid coordinates
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      clients.push({
        id: getValue(idxMap.code) || `row-${i}`,
        division: division,
        store: getValue(idxMap.store),
        code: getValue(idxMap.code),
        name: getValue(idxMap.name),
        city: getValue(idxMap.city),
        phone: getValue(idxMap.phone),
        deliveryDays: getValue(idxMap.days),
        numDeliveryDays: parseInt(getValue(idxMap.numDays)) || 0,
        lat,
        lng,
        avgMonthlyPurchase: getValue(idxMap.avgMonth),
        avgDeliveryPurchase: getValue(idxMap.avgDel),
        logo: logoUrl,
        freeGoodsJan26: getValue(idxMap.free),
      });
    }
  }

  return clients;
};