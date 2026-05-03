"use client";

import type { DiagnoseCropDiseaseInput, DiagnoseCropDiseaseOutput } from "@/ai/flows/diagnose-crop-disease";
import type { DiagnosisChatInput } from "@/ai/flows/diagnosis-chat";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePersistentChat } from "@/hooks/use-persistent-chat";
import type { PlantStage } from "@/components/three/plant-scene-types";

// ─── Schema ────────────────────────────────────────────────────────
export const diagnosisFormSchema = z.object({
  cropImage: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Por favor, suba una imagen.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `El tamaño máximo del archivo es 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
      "Se aceptan archivos .jpg, .png y .webp."
    ),
});

export type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>;

// ─── Weather helpers ───────────────────────────────────────────────
const getWeatherDescription = (code: number) => {
  const descriptions: { [key: number]: string } = {
    0: "Despejado", 1: "Principalmente despejado", 2: "Parcialmente nublado",
    3: "Nublado", 45: "Niebla", 48: "Niebla con escarcha",
    51: "Llovizna ligera", 53: "Llovizna moderada", 55: "Llovizna intensa",
    61: "Lluvia ligera", 63: "Lluvia moderada", 65: "Lluvia intensa",
    71: "Nieve ligera", 73: "Nieve moderada", 75: "Nieve intensa",
    80: "Chubascos ligeros", 81: "Chubascos moderados", 82: "Chubascos intensos",
    95: "Tormenta", 96: "Tormenta con granizo ligero", 99: "Tormenta con granizo intenso",
  };
  return descriptions[code] || "Desconocido";
};

const fetchOpenMeteoWeather = async (latitude: number, longitude: number) => {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordenadas inválidas');
  }
  const params = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,wind_speed_10m_mean',
    timezone: 'auto',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

  const data = await response.json();
  const locationName = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

  return {
    location: locationName,
    coordinates: { lat: latitude, lon: longitude },
    temperature: Math.round(data.current.temperature_2m),
    tempHigh: Math.round(data.daily.temperature_2m_max[0]),
    tempLow: Math.round(data.daily.temperature_2m_min[0]),
    condition: getWeatherDescription(data.current.weather_code),
    humidity: Math.round(data.current.relative_humidity_2m),
    windSpeed: Math.round(data.current.wind_speed_10m * 3.6),
    windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[0] * 3.6),
    windSpeedMax: Math.round(data.daily.wind_speed_10m_max[0] * 3.6),
    icon: () => null,
  };
};

// ─── TTS helpers ───────────────────────────────────────────────────
const getPreferredSpanishVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Microsoft Sabina - Spanish (Mexico)', 'Microsoft Sabina', 'Sabina',
    'Microsoft Raul - Spanish (Mexico)', 'Microsoft Raul', 'Raul',
    'Google español de México', 'Google español',
  ];

  for (const name of preferred) {
    const v = voices.find(voice => voice.name === name || voice.name.includes(name));
    if (v) return v;
  }

  const langCodes = ['es-MX', 'es-ES', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];
  for (const code of langCodes) {
    const v = voices.find(voice => voice.lang === code);
    if (v) return v;
  }

  return voices.find(voice => voice.lang.startsWith('es')) ?? null;
};

// ─── Hook ──────────────────────────────────────────────────────────
export function useDiagnosis(sessionId?: string) {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const { toast } = useToast();
  const [isPlayingRecommendations, setIsPlayingRecommendations] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const {
    messages: chatMessages,
    loading: chatLoading,
    addMessage,
    clearChat,
  } = usePersistentChat('diagnosis', sessionId);
  
  const [lastWeatherData, setLastWeatherData] = useState<any>(null);
  const [plantStage, setPlantStage] = useState<PlantStage>('idle');
  const [growthProgress, setGrowthProgress] = useState(0);
  const [showWeatherModel, setShowWeatherModel] = useState(false);

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    defaultValues: {},
  });

  // ─── Cleanup TTS on unmount ────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // ─── Growth progress animation ────────────────────────────────
  useEffect(() => {
    if (!isLoading || (plantStage !== 'growing' && plantStage !== 'weather')) return;
    const interval = window.setInterval(() => {
      setGrowthProgress((current) => Math.min(0.92, current + 0.07));
    }, 320);
    return () => window.clearInterval(interval);
  }, [isLoading, plantStage]);

  // ─── Geolocation ──────────────────────────────────────────────
  const tryIPGeolocation = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.latitude && data.longitude) {
        setLocation({ lat: data.latitude, lon: data.longitude });
        setGettingLocation(false);
        setError("");
        toast({
          title: "Ubicación Aproximada Obtenida",
          description: `Ubicación basada en IP: ${data.city}, ${data.country_name}`,
          variant: "default",
        });
      } else {
        throw new Error('No se pudieron obtener coordenadas válidas');
      }
    } catch {
      setError("No se pudo obtener la ubicación ni por GPS ni por IP. Verifica tu conexión a internet.");
      setGettingLocation(false);
      toast({ title: "Error de Ubicación", description: "No se pudo obtener la ubicación.", variant: "destructive" });
    }
  }, [toast]);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La geolocalización no es compatible con este navegador.");
      toast({ title: "Error de Geolocalización", description: "No es compatible.", variant: "destructive" });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setGettingLocation(false);
        setError("");
        toast({
          title: "Ubicación Obtenida",
          description: `Coordenadas: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          variant: "default",
        });
      },
      (err) => {
        if (err.code === err.POSITION_UNAVAILABLE) {
          tryIPGeolocation();
          return;
        }
        const messages: Record<number, string> = {
          [err.PERMISSION_DENIED]: "Permisos de ubicación denegados.",
          [err.TIMEOUT]: "La solicitud de ubicación ha expirado.",
        };
        const msg = messages[err.code] || `Error desconocido: ${err.message}`;
        setError(msg);
        setGettingLocation(false);
        toast({ title: "Error de Ubicación", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  }, [toast, tryIPGeolocation]);

  // ─── Image handling ───────────────────────────────────────────
  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setPlantStage('seedling');
        setGrowthProgress(0.12);
        setShowWeatherModel(false);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setPlantStage('idle');
      setGrowthProgress(0);
      setShowWeatherModel(false);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setPlantStage('idle');
    setGrowthProgress(0);
    setShowWeatherModel(false);
    form.setValue('cropImage', undefined as any);
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [form]);

  // ─── TTS ──────────────────────────────────────────────────────
  const speakRecommendations = useCallback((recommendations: string[]) => {
    if (!('speechSynthesis' in window) || !diagnosisResult) {
      setError('Tu navegador no soporta la síntesis de voz');
      return;
    }

    window.speechSynthesis.cancel();

    let text = `Resultado del diagnóstico. `;
    text += `Enfermedad o problema identificado: ${diagnosisResult.diseaseName}. `;
    text += `Nivel de confianza: ${Math.round(diagnosisResult.confidence * 100)} por ciento. `;
    text += `Síntomas observados: ${diagnosisResult.symptoms.join(', ')}. `;
    text += `Recomendaciones para el manejo: ${recommendations.join('. ')}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredSpanishVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsPlayingRecommendations(true);
    utterance.onend = () => { setIsPlayingRecommendations(false); setCurrentUtterance(null); };
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('Error al reproducir el audio del diagnóstico');
      }
      setIsPlayingRecommendations(false);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    setIsPlayingRecommendations(true);
    window.speechSynthesis.speak(utterance);
  }, [diagnosisResult]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingRecommendations(false);
      setCurrentUtterance(null);
    }
  }, []);

  // ─── Chat ─────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || !diagnosisResult || !location || isSendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    setCurrentStepIndex(0);

    await addMessage({ role: 'user', content: userMessage });

    const steps = [
      'Analizando el contexto del diagnóstico...',
      'Consultando manuales técnicos especializados...',
      'Evaluando condiciones climáticas y de cultivo...',
      'Sintetizando recomendaciones personalizadas...',
    ];
    setReasoningSteps(steps);

    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < steps.length) setCurrentStepIndex(step);
    }, 1500);

    try {
      const chatInputData: DiagnosisChatInput = {
        message: userMessage,
        diagnosisContext: {
          diseaseName: diagnosisResult.diseaseName,
          confidence: diagnosisResult.confidence * 100,
          symptoms: diagnosisResult.symptoms,
          recommendations: diagnosisResult.recommendations,
          location: `${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`,
          coordinates: location,
          weatherData: {
            temperature: lastWeatherData?.temperature || 0,
            tempHigh: lastWeatherData?.tempHigh || 0,
            tempLow: lastWeatherData?.tempLow || 0,
            humidity: lastWeatherData?.humidity || 0,
            windSpeed: lastWeatherData?.windSpeed || 0,
            condition: lastWeatherData?.condition || 'Desconocido',
          },
          date: new Date().toISOString(),
        },
        chatHistory: chatMessages.slice(-10).map(msg => ({
          role: msg.role,
          content: `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
        })),
      };

      const response = await fetch('/api/diagnosis-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatInputData),
      });

      if (!response.ok) throw new Error('Failed to get chat response');
      const chatResponse = await response.json();

      clearInterval(stepInterval);
      setReasoningSteps([]);
      await addMessage({ role: 'assistant', content: chatResponse.response });
    } catch {
      clearInterval(stepInterval);
      setReasoningSteps([]);
      await addMessage({ role: 'assistant', content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsSendingMessage(false);
      setCurrentStepIndex(0);
    }
  }, [chatInput, diagnosisResult, location, isSendingMessage, addMessage, chatMessages, lastWeatherData]);

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ─── Form submission ──────────────────────────────────────────
  const onSubmit: SubmitHandler<DiagnosisFormValues> = async (data) => {
    if (!location) {
      setError("Por favor, obtén tu ubicación primero.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosisResult(null);
    setPlantStage('growing');
    setGrowthProgress(0.2);
    setShowWeatherModel(false);

    const file = data.cropImage[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const imageDataUri = reader.result as string;

        setPlantStage('weather');
        setShowWeatherModel(true);
        const weatherData = await fetchOpenMeteoWeather(location.lat, location.lon);
        setShowWeatherModel(false);
        setPlantStage('growing');

        if (!weatherData?.location || !weatherData?.coordinates) {
          throw new Error('Datos climáticos incompletos recibidos');
        }
        setLastWeatherData(weatherData);

        const input: DiagnoseCropDiseaseInput = {
          cropImage: imageDataUri,
          weatherData: {
            location: weatherData.location,
            coordinates: weatherData.coordinates,
            temperature: weatherData.temperature,
            tempHigh: weatherData.tempHigh,
            tempLow: weatherData.tempLow,
            condition: weatherData.condition,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windSpeedMin: weatherData.windSpeedMin,
            windSpeedMax: weatherData.windSpeedMax,
            icon: weatherData.icon,
          },
          date: new Date().toISOString(),
        };

        const response = await fetch('/api/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) throw new Error('Failed to get diagnosis');
        const result = await response.json();
        setDiagnosisResult(result);

        if (result.plantIdentification?.isRaspberry === false || result.confidence === 0) {
          setPlantStage('wilted');
        } else {
          setPlantStage('healthy');
          setGrowthProgress(1);
        }
        toast({ title: "Diagnóstico Completo", description: "La IA ha analizado su imagen del cultivo.", variant: "default" });
      } catch (err: any) {
        setError(`Error al realizar el diagnóstico: ${err.message}`);
        setPlantStage('wilted');
        setShowWeatherModel(false);
        toast({ title: "Error en el Diagnóstico", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return {
    // Form
    form,
    onSubmit,
    isLoading,
    error,
    // Image
    imagePreview,
    handleImageChange,
    handleRemoveImage,
    // Location
    location,
    gettingLocation,
    handleGetLocation,
    // Result
    diagnosisResult,
    // TTS
    isPlayingRecommendations,
    speakRecommendations,
    stopSpeaking,
    // Chat
    showChat,
    setShowChat,
    chatInput,
    setChatInput,
    isSendingMessage,
    reasoningSteps,
    currentStepIndex,
    chatMessages,
    chatLoading,
    handleSendMessage,
    handleChatKeyPress,
    // 3D
    plantStage,
    growthProgress,
    showWeatherModel,
  };
}
