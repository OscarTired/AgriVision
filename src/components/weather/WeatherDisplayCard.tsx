"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Droplets, Wind } from "lucide-react";
import type { WeatherData } from "./types";
import { getThermometerIcon } from "./utils";
import { WeatherForecastGrid } from "./WeatherForecastGrid";
import { AIRecommendationsSection } from "./AIRecommendationsSection";

interface WeatherDisplayCardProps {
  weather: WeatherData;
  loadingRecommendations: boolean;
  recommendations: string[] | null;
  children?: React.ReactNode;
}

export function WeatherDisplayCard({
  weather,
  loadingRecommendations,
  recommendations,
  children,
}: WeatherDisplayCardProps) {
  return (
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

            {/* Slot para chat u otros componentes hijos */}
            {children}

            {/* Mensaje de aviso */}
            <p className="text-xs text-muted-foreground text-center">
              Powered by Open-Meteo API
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
