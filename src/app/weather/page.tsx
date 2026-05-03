// Interfaz de usuario para la página de recomendaciones climáticas para agricultores

"use client";

// Importación de componentes y hooks necesarios
import type { WeatherChatInput } from "@/ai/flows/weather-chat";
import { useEffect, useState } from "react";
import { usePersistentChat } from "@/hooks/use-persistent-chat";
import {
  WeatherControlPanel,
  WeatherDisplayCard,
  WeatherChat,
  WeatherSkeleton,
  MapSelectorModal,
  WeatherEmptyState,
  WeatherError,
  getWeatherIcon,
  getWeatherDescription,
  type WeatherData,
} from "@/components/weather";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Estados para funcionalidad de texto a voz con Web Speech API
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Estados para el chat
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
        await fetchOpenMeteoWeather(data.latitude, data.longitude, selectedDate || undefined);
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
          selectedDate || undefined
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
      await fetchOpenMeteoWeather(location.latitude, location.longitude, selectedDate || undefined);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Función para manejar la selección de ubicación en el mapa
  const handleMapLocationSelect = (coords: { lat: number; lon: number }) => {
    setSelectedCoords(coords);
    setShowMapSelector(false);
    fetchOpenMeteoWeather(coords.lat, coords.lon, selectedDate || undefined);
  };

  // Manejar el cambio de fecha en el selector
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      
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
        <WeatherControlPanel
          manualLocation={manualLocation}
          onManualLocationChange={setManualLocation}
          onManualLocationSearch={handleManualLocationSearch}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          gettingLocation={gettingLocation}
          onGetLocationClick={handleGetLocationClick}
          onShowMapSelector={() => setShowMapSelector(true)}
          loading={loading}
        />

        {/* Selector de mapa en modal */}
        <MapSelectorModal
          open={showMapSelector}
          onClose={() => setShowMapSelector(false)}
          onLocationSelect={handleMapLocationSelect}
        />

        {/* Mostrar error */}
        {error && <WeatherError error={error} />}

        {/* Datos del clima */}
        {loading ? (
          <WeatherSkeleton />
        ) : weather ? (
          <WeatherDisplayCard
            weather={weather}
            loadingRecommendations={loadingRecommendations}
            recommendations={recommendations}
          >
            {/* Chat con Gemini */}
            {recommendations && (
              <WeatherChat
                chatMessages={chatMessages}
                chatLoading={chatLoading}
                isSendingMessage={isSendingMessage}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                onKeyPress={handleChatKeyPress}
                reasoningSteps={reasoningSteps}
                currentStepIndex={currentStepIndex}
              />
            )}
          </WeatherDisplayCard>
        ) : (
          <WeatherEmptyState />
        )}
      </div>
    </div>
  );
}