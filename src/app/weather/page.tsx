// Interfaz de usuario para la página de recomendaciones climáticas para agricultores

"use client";

// Importación de componentes y estilos necesarios
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeatherChatInput } from "@/ai/flows/weather-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { MapPin, Thermometer, Wind, Droplets, Sun, Cloud, CloudRain, CloudSnow, Zap, Loader2, WifiOff, Search, Calendar, Map, CloudDrizzle, Cloudy, SunMedium, CloudLightning, CloudFog, Snowflake, SunDim, ThermometerSun, ThermometerSnowflake, Volume2, VolumeX, MessageCircle, Send, type LucideIcon } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import dynamic from 'next/dynamic';
import { usePersistentChat } from "@/hooks/use-persistent-chat";
import { WeatherSkeleton } from "@/components/weather/WeatherSkeleton";
import { WeatherForecastGrid } from "@/components/weather/WeatherForecastGrid";
import { AIRecommendationsSection } from "@/components/weather/AIRecommendationsSection";

// Importación del mapa de forma dinámica para evitar problemas de SSR
const MapSelector = dynamic(() => import('../../components/MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

// Definición de interfaces para los datos del clima y pronóstico
interface WeatherData {
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

interface ForecastEntry {
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

// Funciones para obtener el ícono del clima basado en el mapeo de código de Open-Meteo
const getWeatherIcon = (weatherCode: number): LucideIcon => {
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
const getWeatherDescription = (weatherCode: number): string => {
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
const getThermometerIcon = (tempLow: number, tempHigh: number): { icon: LucideIcon; color: string } => {
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

// Estados para manejar el clima y la ubicación
export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Estados para recomendaciones
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Estados para selección manual de ubicación
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  
  // Estados para selección de fecha
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados para funcionalidad de texto a voz con Web Speech API
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Estados para el chat
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Hook de chat persistente
  const {
    messages: chatMessages,
    loading: chatLoading,
    addMessage,
    addMessages,
    clearChat
  } = usePersistentChat('weather');

  // Verificar si el navegador soporta Web Speech API
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  // Función para leer las recomendaciones usando Web Speech API
  const speakRecommendations = () => {
    if (!recommendations || !speechSupported) return;
    
    // Detener cualquier síntesis en curso
    window.speechSynthesis.cancel();
    
    setIsSpeaking(true);
    
    const text = recommendations.join('. ');
    const utterance = new SpeechSynthesisUtterance(text);
    setCurrentUtterance(utterance);
    
    // Configurar la voz en español con prioridad específica
    const voices = window.speechSynthesis.getVoices();
    console.log('Voces disponibles:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Lista de voces preferidas en orden de prioridad
    const preferredVoices = [
      'Microsoft Sabina - Spanish (Mexico)',
      'Microsoft Sabina',
      'Sabina',
      'Microsoft Raul - Spanish (Mexico)',
      'Microsoft Raul',
      'Raul',
      'Google español de México',
      'Google español',
      'Spanish (Mexico)',
      'Spanish (Latin America)',
      'Spanish (Spain)',
      'es-MX',
      'es-ES',
      'es-AR',
      'es-CO',
      'es-CL'
    ];
    
    let selectedVoice = null;
    
    // Buscar por nombre exacto primero
    for (const preferredName of preferredVoices) {
      selectedVoice = voices.find(voice => 
        voice.name === preferredName || 
        voice.name.includes(preferredName)
      );
      if (selectedVoice) {
        console.log(`Voz seleccionada por nombre: ${selectedVoice.name} (${selectedVoice.lang})`);
        break;
      }
    }
    
    // Si no se encuentra por nombre, buscar por código de idioma
    if (!selectedVoice) {
      const spanishLanguageCodes = ['es-MX', 'es-ES', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];
      for (const langCode of spanishLanguageCodes) {
        selectedVoice = voices.find(voice => voice.lang === langCode);
        if (selectedVoice) {
          console.log(`Voz seleccionada por código de idioma: ${selectedVoice.name} (${selectedVoice.lang})`);
          break;
        }
      }
    }
    
    // Fallback: cualquier voz que empiece con 'es'
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('es'));
      if (selectedVoice) {
        console.log(`Voz seleccionada como fallback: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn('No se encontró ninguna voz en español disponible');
    }
    
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Velocidad ligeramente más lenta
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };
    
    utterance.onerror = (event) => {
      // Solo mostrar error si no fue una cancelación manual
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('Error al reproducir el audio');
      }
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Función para detener la lectura
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentUtterance(null);
  };

  // Función para enviar mensaje en el chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !weather || !recommendations || isSendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    setCurrentStepIndex(0);

    // Agregar mensaje del usuario inmediatamente
    await addMessage({ role: 'user', content: userMessage });

    // Pasos de razonamiento que se mostrarán secuencialmente
    const steps = [
      'Analizando condiciones climáticas actuales...',
      'Consultando manuales técnicos especializados...',
      'Evaluando recomendaciones para el cultivo...',
      'Sintetizando respuesta personalizada...',
    ];
    setReasoningSteps(steps);

    // Animar los pasos de razonamiento
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setCurrentStepIndex(step);
      }
    }, 1500);

    try {
       const chatInputData: WeatherChatInput = {
         message: userMessage,
         weatherContext: {
           location: weather.location,
           coordinates: weather.coordinates,
           date: weather.date.toISOString(),
           tempHigh: weather.tempHigh,
           tempLow: weather.tempLow,
           humidity: weather.humidity,
           windSpeed: weather.windSpeed,
           condition: weather.condition,
           recommendations: recommendations,
         },
         chatHistory: chatMessages.slice(-10).map(msg => ({
            role: msg.role,
            content: `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
          })),
       };

       const response = await fetch('/api/weather-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatInputData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get weather chat response');
        }
        
        const chatResponse = await response.json();
      
      clearInterval(stepInterval);
      setReasoningSteps([]);
      await addMessage({ role: 'assistant', content: chatResponse.response });
    } catch (error) {
      console.error('Error en el chat:', error);
      clearInterval(stepInterval);
      setReasoningSteps([]);
      await addMessage({ 
        role: 'assistant', 
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.' 
      });
    } finally {
      setIsSendingMessage(false);
      setCurrentStepIndex(0);
    }
  };

  // Función para manejar Enter en el input del chat
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Función para obtener datos clima usando Open-Meteo API
  const fetchOpenMeteoWeather = async (latitude: number, longitude: number, targetDate?: Date) => {
    setLoading(true);
    setError(null);
    setGettingLocation(false);

    try {
      // Validar coordenadas
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordenadas inválidas');
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación
      
      const targetDateNormalized = targetDate ? new Date(targetDate) : new Date();
      targetDateNormalized.setHours(0, 0, 0, 0);
      
      const isHistorical = targetDateNormalized < currentDate;
      const isFuture = targetDateNormalized > currentDate;
      
      let url: string;
      let params = new URLSearchParams({
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,wind_speed_10m_mean',
        timezone: 'auto'
      });

      if (isHistorical) {
        // Para datos históricos - usar API de archivo
        const startDate = new Date(targetDateNormalized);
        const endDate = new Date(targetDateNormalized);
        endDate.setDate(endDate.getDate() + 6); // 7 días total incluyendo el día inicial
        
        // Validar que la fecha histórica no sea muy antigua (Open-Meteo tiene límites)
        const minDate = new Date('2022-01-01');
        if (startDate < minDate) {
          throw new Error('Los datos históricos solo están disponibles desde enero de 2022');
        }
        
        params.append('start_date', startDate.toISOString().split('T')[0]);
        params.append('end_date', endDate.toISOString().split('T')[0]);
        url = `https://archive-api.open-meteo.com/v1/archive?${params}`;
      } else {
        // Para datos actuales y futuros
        if (isFuture) {
          // Validar que la fecha futura no sea muy lejana
          const maxFutureDate = new Date();
          maxFutureDate.setDate(maxFutureDate.getDate() + 14);
          if (targetDateNormalized > maxFutureDate) {
            throw new Error('Solo se pueden consultar pronósticos hasta 14 días en el futuro');
          }
          params.append('forecast_days', '14');
        } else {
          params.append('forecast_days', '7');
        }
        url = `https://api.open-meteo.com/v1/forecast?${params}`;
      }

      console.log("Fetching weather from URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.reason) {
            errorMessage += `: ${errorData.reason}`;
          }
        } catch {
          // Si no se puede parsear el error, usar mensaje genérico
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Raw API Data:", data);

      // Validar que la respuesta tenga los datos esperados
      if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
        throw new Error('No se recibieron datos válidos del clima');
      }

      // Obtener nombre de la ubicación usando geocoding reverso
      let locationName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
      try {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${latitude.toFixed(4)},${longitude.toFixed(4)}&count=1&language=es&format=json`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.results && geoData.results.length > 0) {
            const result = geoData.results[0];
            locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`;
          }
        }
      } catch (geoError) {
        console.log("Could not fetch location name:", geoError);
      }

      // Encontrar el índice correcto para la fecha objetivo
      let targetDayIndex = 0;
      if (targetDate) {
        const targetDateStr = targetDateNormalized.toISOString().split('T')[0];
        targetDayIndex = data.daily.time.findIndex((dateStr: string) => dateStr === targetDateStr);
        if (targetDayIndex === -1) {
          targetDayIndex = 0; // Fallback al primer día si no se encuentra
        }
      }

      const formattedWeatherData: WeatherData = {
        location: locationName,
        coordinates: { lat: latitude, lon: longitude },
        temperature: Math.round(isHistorical || targetDate ? data.daily.temperature_2m_max[targetDayIndex] : (data.current?.temperature_2m || data.daily.temperature_2m_max[targetDayIndex])),
        tempHigh: Math.round(data.daily.temperature_2m_max[targetDayIndex]),
        tempLow: Math.round(data.daily.temperature_2m_min[targetDayIndex]),
        condition: getWeatherDescription(isHistorical || targetDate ? data.daily.weather_code[targetDayIndex] : (data.current?.weather_code || data.daily.weather_code[targetDayIndex])),
        humidity: Math.round(isHistorical || targetDate ? data.daily.relative_humidity_2m_mean[targetDayIndex] : (data.current?.relative_humidity_2m || data.daily.relative_humidity_2m_mean[targetDayIndex])),
        windSpeed: Math.round((isHistorical || targetDate ? data.daily.wind_speed_10m_max[targetDayIndex] : (data.current?.wind_speed_10m || data.daily.wind_speed_10m_max[targetDayIndex])) * 3.6), // Convert m/s to km/h
        windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[targetDayIndex] * 3.6), // Convert m/s to km/h
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max[targetDayIndex] * 3.6), // Convert m/s to km/h
        icon: getWeatherIcon(isHistorical || targetDate ? data.daily.weather_code[targetDayIndex] : (data.current?.weather_code || data.daily.weather_code[targetDayIndex])),
        date: targetDate || currentDate,
        forecast: data.daily.time.slice(1, 8).map((dateStr: string, index: number) => {
          const forecastDate = new Date(dateStr);
          return {
            date: forecastDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            tempHigh: Math.round(data.daily.temperature_2m_max[index + 1]),
            tempLow: Math.round(data.daily.temperature_2m_min[index + 1]),
            condition: getWeatherDescription(data.daily.weather_code[index + 1]),
            icon: getWeatherIcon(data.daily.weather_code[index + 1]),
            humidity: Math.round(data.daily.relative_humidity_2m_mean[index + 1]),
            windSpeed: Math.round(data.daily.wind_speed_10m_max[index + 1] * 3.6),
            windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[index + 1] * 3.6),
            windSpeedMax: Math.round(data.daily.wind_speed_10m_max[index + 1] * 3.6),
          };
        }),
      };

      setWeather(formattedWeatherData);
      setLoading(false);
      console.log("Conjunto de datos ordenados correctamente:", formattedWeatherData);

    await fetchRecommendations(formattedWeatherData);
    } catch (err: any) {
      console.error("Error en la extracción de datos:", err);
      setError(`Error al obtener datos del clima: ${err.message}`);
      setLoading(false);
    }
  };

  // Función para obtener recomendaciones basadas en el clima usando el flujo de AI
  const fetchRecommendations = async (weatherData: WeatherData) => {
    setLoadingRecommendations(true);
    setError(null);

    try {
      const input = {
        location: weatherData.location,
        coordinates: weatherData.coordinates,
        date: weatherData.date.toISOString(),
        tempHigh: weatherData.tempHigh,
        tempLow: weatherData.tempLow,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        condition: weatherData.condition,
      };

      const response = await fetch('/api/weather-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get weather recommendations');
        }
        
        const result = await response.json();
      setRecommendations(result.recommendations);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Error al obtener recomendaciones agrícolas.");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Función fallback para geolocalización por IP
  const tryIPGeolocation = async () => {
    try {
      console.log('Intentando geolocalización por IP...');
      
      // Usar ipapi.co que es gratuito y no requiere API key
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('Ubicación obtenida por IP:', {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
          country: data.country_name
        });
        
        // Usar la ubicación obtenida por IP para buscar el clima
        await fetchOpenMeteoWeather(data.latitude, data.longitude, selectedDate);
        setGettingLocation(false);
        setError(""); // Limpiar errores previos
        
        // Mostrar mensaje informativo sobre la ubicación aproximada
        console.log(`Ubicación aproximada obtenida: ${data.city}, ${data.country_name}`);
      } else {
        throw new Error('No se pudieron obtener coordenadas válidas');
      }
    } catch (ipError) {
      console.error('Error en geolocalización por IP:', ipError);
      
      // Si también falla la geolocalización por IP, mostrar error final
      const errorMessage = "No se pudo obtener la ubicación ni por GPS ni por IP. Verifica tu conexión a internet.";
      setError(errorMessage);
      setGettingLocation(false);
      setLoading(false);
    }
  };

  // Función para manejar la obtención de ubicación actual desde el navegador
  const handleGetLocationClick = () => {
    console.log('Iniciando solicitud de geolocalización...');
    console.log('Navegador:', navigator.userAgent);
    console.log('HTTPS:', window.location.protocol === 'https:');
    console.log('Localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (!navigator.geolocation) {
      const errorMsg = "La geolocalización no es compatible con este navegador.";
      console.error(errorMsg);
      setError(errorMsg);
      setGettingLocation(false);
      setLoading(false);
      return;
    }

    // Verificar permisos antes de solicitar ubicación
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Estado de permisos de geolocalización:', result.state);
        if (result.state === 'denied') {
          const errorMsg = "Los permisos de ubicación están denegados. Por favor, habilítalos en la configuración del navegador.";
          setError(errorMsg);
          setGettingLocation(false);
          setLoading(false);
          return;
        }
      }).catch((err) => {
        console.warn('No se pudo verificar permisos:', err);
      });
    }

    setGettingLocation(true);
    
    const options = {
      enableHighAccuracy: false, // Cambiar a false para mejor compatibilidad
      timeout: 15000, // Aumentar timeout
      maximumAge: 300000, // 5 minutos
    };
    
    console.log('Opciones de geolocalización:', options);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Ubicación obtenida exitosamente:', {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        fetchOpenMeteoWeather(
          position.coords.latitude, 
          position.coords.longitude, 
          selectedDate
        );
        setGettingLocation(false);
        setError(""); // Limpiar errores previos
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        
        let errorMessage = "No se pudo obtener la ubicación. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permisos de ubicación denegados. Por favor, habilita los permisos de ubicación en tu navegador.";
            console.error('Permisos de geolocalización denegados por el usuario');
            setError(errorMessage);
            setGettingLocation(false);
            setLoading(false);
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('Información de ubicación no disponible, intentando con IP geolocation...');
            // Fallback: usar geolocalización por IP
            tryIPGeolocation();
            return; // No mostrar error aún, esperar resultado del fallback
          case error.TIMEOUT:
            errorMessage = "La solicitud de ubicación ha expirado. Por favor, intenta nuevamente.";
            console.error('Timeout en la solicitud de geolocalización');
            setError(errorMessage);
            setGettingLocation(false);
            setLoading(false);
            break;
          default:
            errorMessage = `Error desconocido al obtener la ubicación: ${error.message}`;
            console.error('Error desconocido:', error.message);
            setError(errorMessage);
            setGettingLocation(false);
            setLoading(false);
            break;
        }
      },
      options
    );
  };

  // Función para manejar la búsqueda manual de ubicación
  const handleManualLocationSearch = async () => {
    if (!manualLocation.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Buscar ubicación usando Open-Meteo Geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=es&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Error al buscar la ubicación');
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No se encontró la ubicación. Intenta con otro nombre.');
      }
      
      const location = data.results[0];
      await fetchOpenMeteoWeather(location.latitude, location.longitude, selectedDate);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Función para manejar la selección de ubicación en el mapa
  const handleMapLocationSelect = (coords: { lat: number; lon: number }) => {
    setSelectedCoords(coords);
    setShowMapSelector(false);
    fetchOpenMeteoWeather(coords.lat, coords.lon, selectedDate);
  };

  // Manejar el cambio de fecha en el selector
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
      
      // Si ya tenemos coordenadas, volver a buscar con la nueva fecha
      if (weather?.coordinates) {
        fetchOpenMeteoWeather(weather.coordinates.lat, weather.coordinates.lon, date);
      }
    }
  };

  // Renderizar la interfaz de usuario con los datos del clima y las recomendaciones
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/10 blur-3xl animate-pulse-subtle" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-pulse-subtle" style={{animationDelay: '1s'}} />
      <div className="absolute bottom-40 left-1/4 w-24 h-24 rounded-full bg-primary/5 blur-2xl animate-pulse-subtle" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto py-8 lg:py-12 relative z-10 space-y-8">
      {/* Panel de controles */}
      <div className="relative z-50 stagger-item">
        <div className="relative bio-panel rounded-[2rem] p-1 overflow-visible card-hover">
          <div className="shimmer-bio" style={{ borderRadius: 'inherit' }} />
          <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full overflow-visible">
        <Card className="bg-transparent border-0 shadow-none relative overflow-visible">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3 animate-slide-down-fade font-display">
            <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary),0.2)] animate-float-bio">
              <MapPin className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            </div>
            <span className="text-iridescent">Análisis Climático</span>
          </CardTitle>
          <CardDescription className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            Selecciona una ubicación y fecha para ver el pronóstico del clima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {/* Main search and date row */}
          <div className="flex flex-col md:flex-row gap-4 items-end stagger-item relative z-50 w-full" style={{ animationDelay: '150ms' }}>
            {/* Búsqueda manual (Principal) */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buscar por ciudad</Label>
              <div className="relative group max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Ej: Lima, Perú o Santiago, Chile"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                  className="pl-10 pr-24 h-12 text-base input-focus-ring bg-background shadow-sm border-border/60 rounded-xl w-full block"
                />
                <Button 
                  onClick={handleManualLocationSearch} 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4 btn-press rounded-lg"
                  disabled={loading}
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Selector de Fecha */}
            <div className="space-y-2 relative w-full md:w-auto">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de consulta</Label>
              <Button
                variant="outline"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-12 w-full md:w-48 px-4 flex items-center justify-between border-border/60 shadow-sm bg-background hover:bg-muted/50 btn-press rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedDate.toLocaleDateString('es-ES')}</span>
                </div>
              </Button>
              {showDatePicker && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm sm:hidden animate-fade-in"
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="fixed inset-x-4 bottom-4 z-[9999] sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-[calc(100%+0.5rem)] sm:right-0 sm:left-auto bg-background border border-border/60 rounded-xl shadow-2xl animate-scale-in origin-top sm:origin-top-right overflow-hidden flex justify-center">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={new Date(2020, 0, 1)}
                      maxDate={new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)}
                      inline
                      locale={es}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground stagger-item" style={{ animationDelay: '200ms' }}>
            <div className="flex-1 h-px bg-border/40"></div>
            <span className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/70">o elige otro método</span>
            <div className="flex-1 h-px bg-border/40"></div>
          </div>

          {/* Opciones de ubicación alternativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '250ms' }}>
            {/* Ubicación actual (GPS) */}
            <Button
              variant="outline"
              onClick={handleGetLocationClick}
              disabled={gettingLocation}
              className="h-auto py-3 px-4 flex items-center justify-start gap-4 border-border/60 bg-background shadow-sm hover:border-primary/40 hover:bg-primary/5 btn-press group transition-all rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-normal shrink-0">
                {gettingLocation ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground text-sm">
                  {gettingLocation ? "Obteniendo..." : "Usar mi ubicación GPS"}
                </div>
                <div className="text-xs text-muted-foreground">Alta precisión</div>
              </div>
            </Button>

            {/* Selección en mapa */}
            <Button
              variant="outline"
              onClick={() => setShowMapSelector(true)}
              className="h-auto py-3 px-4 flex items-center justify-start gap-4 border-border/60 bg-background shadow-sm hover:border-accent/40 hover:bg-accent/5 btn-press group transition-all rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-normal shrink-0">
                <Map className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground text-sm">Seleccionar en el mapa</div>
                <div className="text-xs text-muted-foreground">Búsqueda visual interactiva</div>
              </div>
            </Button>
          </div>
        </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Selector de mapa en modal */}
      {showMapSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[99999] animate-fade-in" style={{position: 'fixed', inset: 0, width: '100vw', height: '100vh', padding: 0, margin: 0}}>
<div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl mx-4 sm:mx-8 flex flex-col relative animate-scale-in border border-border/50" style={{height: 'auto', maxHeight: '70vh', minHeight: '500px'}}>
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border/40 flex-shrink-0 bg-muted/20 rounded-t-2xl">
              <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground flex items-center gap-2">
                <Map className="w-5 h-5 text-accent" /> Selecciona una ubicación
              </h3>
              <Button 
                variant="outline" 
                onClick={() => setShowMapSelector(false)}
                className="hover:bg-gray-100 shrink-0"
                size="sm"
              >
                Cerrar
              </Button>
            </div>
            <div className="flex-1 p-2 sm:p-6 overflow-hidden">
<div className="h-full w-full" style={{height: '400px', minHeight: '300px', maxHeight: 'calc(70vh - 120px)'}}>
                <MapSelector onLocationSelect={handleMapLocationSelect} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg animate-scale-in">
          <p className="font-bold font-display">Error:</p>
          <p className="font-body text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Datos del clima */}
      {loading ? (
        /* Skeleton mientras cargan los datos del clima */
        <WeatherSkeleton />
      ) : weather ? (
        <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden">
          <div className="shimmer-bio" style={{ animationDelay: '2s' }} />
          <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
        <Card className="shadow-xl overflow-hidden border-0 bg-transparent shadow-none">
          <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 bg-[length:200%_200%] animate-gradient-shift" style={{ animationDuration: '8s' }}>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="w-7 h-7" />
                  {weather.location}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-1">
                  {weather.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <weather.icon className="w-16 h-16 opacity-80" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            {/* Condiciones actuales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg stagger-item card-hover">
                {(() => {
                  const { icon: ThermometerIcon, color } = getThermometerIcon(weather.tempLow, weather.tempHigh);
                  return <ThermometerIcon className={`w-10 h-10 ${color} mb-2 transition-transform duration-normal hover:scale-110`} />;
                })()}
                <p className="text-3xl font-bold">{weather.tempLow}°C - {weather.tempHigh}°C</p>
                <p className="text-muted-foreground">Temperatura</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg stagger-item card-hover">
                <Droplets className="w-10 h-10 text-blue-500 mb-2 transition-transform duration-normal hover:scale-110" />
                <p className="text-3xl font-bold">{weather.humidity}%</p>
                <p className="text-muted-foreground">Humedad</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg stagger-item card-hover">
                <Wind className="w-10 h-10 text-gray-500 mb-2 transition-transform duration-normal hover:scale-110" />
                <p className="text-3xl font-bold">{weather.windSpeedMin} - {weather.windSpeedMax} km/h</p>
                <p className="text-muted-foreground">Viento</p>
              </div>
            </div>

            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-lg font-medium">{weather.condition}</p>
            </div>

            {/* Pronóstico de 7 días */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Pronóstico de 7 días</h3>
              <WeatherForecastGrid forecast={weather.forecast} />
            </div>
            {/* Recomendaciones Agrícolas (IA) */}
            <div>
              <AIRecommendationsSection
                loading={loadingRecommendations}
                recommendations={recommendations}
              />
            </div>

            {/* Chat con Gemini */}
            {recommendations && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Chat Agrícola</h3>
                  <Button
                    onClick={() => setShowChat(!showChat)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {showChat ? 'Ocultar Chat' : 'Abrir Chat'}
                  </Button>
                </div>
                
                <div className={`grid transition-all duration-300 ease-in-out ${showChat ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <Card className="border border-border/60 shadow-md mt-2">
                      <CardContent className="p-4">
                      {/* Área de mensajes */}
                      <div className="h-64 overflow-y-auto mb-4 p-3 bg-muted/50 rounded-lg">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground mt-20">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-float" style={{ animationDuration: '3s' }} />
                            <p className="font-body text-sm">¡Hola! Puedes preguntarme cualquier cosa sobre las recomendaciones climáticas o agricultura en general.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {chatMessages.map((message, index) => (
                              <div
                                key={index}
                                className={`flex ${
                                  message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 ${
                                    message.role === 'user'
                                      ? 'bg-primary text-primary-foreground chat-bubble-user'
                                      : 'bg-card border border-border/60 shadow-sm chat-bubble-assistant'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                                </div>
                              </div>
                            ))}
                            {/* Pasos de razonamiento animados */}
                            {isSendingMessage && reasoningSteps.length > 0 && (
                              <div className="flex justify-start chat-msg-enter">
                                <div className="bg-card border border-border p-3 rounded-lg shadow-sm max-w-[90%]">
                                  <div className="flex items-start gap-3">
                                    <div className="relative mt-0.5">
                                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                    <div className="space-y-1.5 min-w-[200px]">
                                      {reasoningSteps.map((step, idx) => (
                                        <div
                                          key={idx}
                                          className={`text-sm font-body transition-all duration-700 ${
                                            idx === currentStepIndex
                                              ? 'text-foreground opacity-100 translate-x-0'
                                              : idx < currentStepIndex
                                              ? 'text-muted-foreground/60 opacity-60 translate-x-1'
                                              : 'text-muted-foreground/30 opacity-30 -translate-x-1'
                                          }`}
                                        >
                                          <span className="inline-flex items-center gap-2">
                                            {idx < currentStepIndex && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                            )}
                                            {idx === currentStepIndex && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            )}
                                            {idx > currentStepIndex && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                                            )}
                                            {step}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Fallback loading state */}
                            {(chatLoading && !isSendingMessage) && (
                              <div className="flex justify-start chat-msg-enter">
                                <div className="bg-card border border-border p-3 rounded-lg shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground font-body">Cargando...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Input para escribir mensajes */}
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={handleChatKeyPress}
                          placeholder="Escribe tu pregunta sobre agricultura o clima..."
                          disabled={isSendingMessage}
                          className="flex-1 font-body input-focus-ring min-w-0"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || isSendingMessage}
                          size="sm"
                          className="px-3 btn-press transition-all duration-normal flex-shrink-0"
                        >
                          {isSendingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 transition-transform duration-normal group-hover:translate-x-0.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </div>
              </div>
            )}
            {/* Mensaje de aviso */}
            <p className="text-xs text-muted-foreground text-center">
              Powered by Open-Meteo API
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      ) : (
        <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
          <div className="shimmer-bio" style={{ animationDelay: '2s' }} />
          <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
        <Card className="shadow-lg bg-transparent border-0">
          <CardContent className="flex flex-col items-center justify-center text-center py-16">
            <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin datos del clima</h3>
            <p className="text-muted-foreground">
              Selecciona una ubicación para cargar los datos del clima
            </p>

            {/* Mensaje de aviso */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Powered by Open-Meteo API
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}