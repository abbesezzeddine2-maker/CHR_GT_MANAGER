import { Client } from '../types';

export const extractSheetId = (url: string): string | null => {
  const match = url.match(/\/d\/(.*?)(\/|$)/);
  return match ? match[1] : null;
};

// Helper to transform Google Drive viewing links into direct image links
const sanitizeLogoUrl = (url: string): string => {
  if (!url) return '';
  const cleanUrl = url.replace(/^"|"$/g, '').trim();
  const driveRegex = /(?:drive|docs)\.google\.com\/.*(?:id=|d\/)([a-zA-Z0-9_-]+)/;
  const match = cleanUrl.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return cleanUrl;
};

// Robust CSV Line Parser that handles both comma and semicolon
const parseCSVLine = (text: string, delimiter: string): string[] => {
  // Regex dynamically based on delimiter
  // This looks for delimiter followed by even number of quotes (to ignore delimiters inside quotes)
  // Simple fallback split for speed if no quotes involved usually works for simple data, 
  // but for robustness we stick to a simpler split if complex regex fails.
  
  if (delimiter === ';') {
    return text.split(';').map(t => t.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  }
  
  // Standard Comma CSV regex
  const pattern = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const fields = text.split(pattern);
  return fields.map(field => {
    let val = field.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    return val.replace(/""/g, '"');
  });
};

export const parseCSV = (csvText: string): Client[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Detect delimiter based on first line
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  // Parse headers
  const headers = parseCSVLine(firstLine, delimiter);
  
  console.log(`CSV Detected: Delimiter '${delimiter}', Headers found:`, headers);

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
    logo: getColIndex(['Logo', 'Image', 'Photo']),
    free: getColIndex(['Gratuité', 'Gratuite', 'Free']),
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line, delimiter);
    
    const getValue = (index: number) => (index !== -1 && values[index]) ? values[index] : '';

    const latStr = getValue(idxMap.lat).replace(',', '.');
    const lngStr = getValue(idxMap.lng).replace(',', '.');
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    const division = getValue(idxMap.division);

    let logoUrl = sanitizeLogoUrl(getValue(idxMap.logo));
    
    // Hardcoded overrides for brands
    if (division === 'O152') {
      logoUrl = 'https://drive.google.com/thumbnail?id=1WLnyAQ0Y2Hv88COFP_0nOpnPnj5s0TfY&sz=w500';
    } else if (division === 'Y150') {
      logoUrl = 'https://drive.google.com/thumbnail?id=1vXFeon3UtAJgky8hX7Z9gRGKIBbngxnR&sz=w500';
    }

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
