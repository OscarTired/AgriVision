import type { LucideIcon } from "lucide-react";

export interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  temperature: number;
  tempHigh: number;
  tempLow: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windSpeedMin: number;
  windSpeedMax: number;
  icon: LucideIcon;
  forecast: ForecastEntry[];
  date: Date;
}

export interface ForecastEntry {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: LucideIcon;
  humidity: number;
  windSpeed: number;
  windSpeedMin: number;
  windSpeedMax: number;
}
