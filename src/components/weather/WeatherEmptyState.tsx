"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WifiOff } from "lucide-react";

export function WeatherEmptyState() {
  return (
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
  );
}
