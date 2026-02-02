export interface Client {
  id: string;
  division: string;
  store: string;
  code: string;
  name: string;
  city: string;
  phone: string;
  deliveryDays: string;
  numDeliveryDays: number;
  lat: number;
  lng: number;
  avgMonthlyPurchase: string;
  avgDeliveryPurchase: string;
  logo: string;
  freeGoodsJan26: string;
}

export interface MapState {
  center: [number, number];
  zoom: number;
}
