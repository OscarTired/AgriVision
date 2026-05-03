"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Search, Calendar, Map } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";

interface WeatherControlPanelProps {
  manualLocation: string;
  onManualLocationChange: (value: string) => void;
  onManualLocationSearch: () => void;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  gettingLocation: boolean;
  onGetLocationClick: () => void;
  onShowMapSelector: () => void;
  loading: boolean;
}

export function WeatherControlPanel({
  manualLocation,
  onManualLocationChange,
  onManualLocationSearch,
  selectedDate,
  onDateChange,
  gettingLocation,
  onGetLocationClick,
  onShowMapSelector,
  loading,
}: WeatherControlPanelProps) {
  return (
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
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end stagger-item relative z-50 w-full" style={{ animationDelay: '150ms' }}>
                {/* Búsqueda manual (Principal) */}
                <div className="flex-1 space-y-2 w-full min-w-0">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buscar por ciudad</Label>
                  <div className="relative group max-w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Ej: Lima, Perú o Santiago, Chile"
                      value={manualLocation}
                      onChange={(e) => onManualLocationChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && onManualLocationSearch()}
                      className="pl-10 pr-24 h-12 text-base input-focus-ring bg-background shadow-sm border-border/60 rounded-xl w-full block"
                    />
                    <Button 
                      onClick={onManualLocationSearch} 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4 btn-press rounded-lg"
                      disabled={loading}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Selector de Fecha */}
                <div className="space-y-2 relative z-50 w-full md:w-auto md:min-w-[200px]">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha objetivo</Label>
                  <div className="relative">
                    <DatePicker
                      selected={selectedDate}
                      onChange={onDateChange}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="DD/MM/AAAA"
                      locale={es}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="pl-10 pr-4 h-12 w-full text-base bg-background shadow-sm border border-border/60 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-normal"
                      wrapperClassName="w-full"
                      popperClassName="shadow-xl rounded-xl border border-border/50 overflow-hidden animate-scale-in z-[9999] !left-0 !mt-14"
                      popperPlacement="bottom-start"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                  </div>
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
                  onClick={onGetLocationClick}
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
                  onClick={onShowMapSelector}
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
  );
}
