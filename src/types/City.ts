import type { Unit } from "./Unit.ts";

export interface City {
  id: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface AppState {
  unit: Unit;
  cities: City[];
  defaultCityId: string | null;
}