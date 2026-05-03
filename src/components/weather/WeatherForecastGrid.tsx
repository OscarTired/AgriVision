"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Wind, type LucideIcon } from "lucide-react";

interface ForecastEntry {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: LucideIcon;
  humidity: number;
  windSpeedMin: number;
  windSpeedMax: number;
}

interface WeatherForecastGridProps {
  forecast: ForecastEntry[];
}

export function WeatherForecastGrid({ forecast }: WeatherForecastGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {forecast.map((item, index) => {
        const ItemIcon = item.icon;
        return (
          <div
            key={index}
            className="p-4 rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm card-hover stagger-item group transition-all duration-normal hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_16px_rgba(var(--primary),0.15)] cursor-default"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{item.date}</p>
              <ItemIcon className="w-9 h-9 text-accent transition-transform duration-normal group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(var(--accent),0.7)]" />
              <p className="text-base font-bold">{item.tempHigh}° / {item.tempLow}°</p>
              <p className="text-xs text-muted-foreground leading-tight">{item.condition}</p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground/80 w-full">
                <span className="flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3" />{item.humidity}%
                </span>
                <span className="flex items-center justify-center gap-1">
                  <Wind className="w-3 h-3" />{item.windSpeedMin}-{item.windSpeedMax} km/h
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
