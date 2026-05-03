import { Sun, SunDim, Cloudy, Cloud, CloudFog, Snowflake, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, ThermometerSnowflake, Thermometer, ThermometerSun, type LucideIcon } from "lucide-react";

// Funciones para obtener el ícono del clima basado en el mapeo de código de Open-Meteo
export const getWeatherIcon = (weatherCode: number): LucideIcon => {
  if (weatherCode === 0) return Sun; // Clear sky
  if (weatherCode === 1) return SunDim; // Mainly clear
  if (weatherCode === 2) return Cloudy; // Partly cloudy
  if (weatherCode === 3) return Cloud; // Overcast
  if (weatherCode === 45) return CloudFog; // Fog
  if (weatherCode === 48) return Snowflake; // Fog with frost
  if (weatherCode >= 51 && weatherCode <= 55) return CloudDrizzle; // Drizzle
  if (weatherCode >= 61 && weatherCode <= 67) return CloudRain; // Rain
  if (weatherCode >= 71 && weatherCode <= 86) return CloudSnow; // Snow
  if (weatherCode === 95) return CloudLightning; // Thunderstorm
  if (weatherCode === 96) return ThermometerSnowflake; // Thunderstorm with light hail
  if (weatherCode === 99) return CloudLightning; // Thunderstorm with heavy hail
  return Cloud; // Default
};

// Función para obtener la descripción del clima basada en el mapeo de código de Open-Meteo (en español)
export const getWeatherDescription = (weatherCode: number): string => {
  const codes: { [key: number]: string } = {
    0: "Cielo despejado",
    1: "Principalmente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    71: "Nieve ligera",
    73: "Nieve moderada",
    75: "Nieve intensa",
    95: "Tormenta eléctrica",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo intenso"
  };
  return codes[weatherCode] || "Condiciones desconocidas";
};

// Función para obtener el ícono del termómetro basado en la temperatura promedio (tempLow y tempHigh)
export const getThermometerIcon = (tempLow: number, tempHigh: number): { icon: LucideIcon; color: string } => {
  const avgTemp = (tempLow + tempHigh) / 2;
  
  if (avgTemp <= 0) {
    return { icon: ThermometerSnowflake, color: "text-blue-600" };
  } else if (avgTemp <= 10) {
    return { icon: ThermometerSnowflake, color: "text-blue-400" };
  } else if (avgTemp <= 20) {
    return { icon: Thermometer, color: "text-primary" };
  } else if (avgTemp <= 30) {
    return { icon: ThermometerSun, color: "text-orange-500" };
  } else {
    return { icon: ThermometerSun, color: "text-red-600" };
  }
};
