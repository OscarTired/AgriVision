"use client";

import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from 'next/dynamic';

const MapSelector = dynamic(() => import('../MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

interface MapSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (coords: { lat: number; lon: number }) => void;
}

export function MapSelectorModal({ open, onClose, onLocationSelect }: MapSelectorModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[99999] animate-fade-in" style={{position: 'fixed', inset: 0, width: '100vw', height: '100vh', padding: 0, margin: 0}}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl mx-4 sm:mx-8 flex flex-col relative animate-scale-in border border-border/50" style={{height: 'auto', maxHeight: '70vh', minHeight: '500px'}}>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border/40 flex-shrink-0 bg-muted/20 rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5 text-accent" /> Selecciona una ubicación
          </h3>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="hover:bg-gray-100 shrink-0"
            size="sm"
          >
            Cerrar
          </Button>
        </div>
        <div className="flex-1 p-2 sm:p-6 overflow-hidden">
          <div className="h-full w-full" style={{height: '400px', minHeight: '300px', maxHeight: 'calc(70vh - 120px)'}}>
            <MapSelector onLocationSelect={onLocationSelect} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
