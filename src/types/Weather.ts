export interface GeoResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface ForecastResult {
  temperature: number;
  symbol: string;
}

export interface PronosticoDia {
  date: string;
  max: number;
  min: number;
}

export interface PronosticoResult {
  symbol: string;
  days: PronosticoDia[];
}