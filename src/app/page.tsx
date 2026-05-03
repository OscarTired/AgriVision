'use client';

import { DiagnosisClientPage } from '@/components/diagnosis/DiagnosisClientPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Scan, BookOpen, ArrowRight, Dna } from 'lucide-react';

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || undefined;
  
  return <DiagnosisClientPage sessionId={sessionId} />;
}

export default function DiagnoseCropPage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center">
      {/* Background elements are handled globally in layout.tsx, but we can add page-specific glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 dark:bg-secondary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      
      <div className="container mx-auto py-10 lg:py-16 px-4 max-w-5xl relative z-10 w-full">
        {/* Holographic Header */}
        <div className="mb-12 lg:mb-16 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6 stagger-item" style={{ animationDelay: '0ms' }}>
            <div className="relative w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary),0.2)] animate-float-bio">
              <Dna className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>
            <span className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">Bio-Análisis IA</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight mb-4 stagger-item" style={{ animationDelay: '50ms' }}>
            Diagnóstico de <span className="text-iridescent">Cultivos</span>
          </h1>
          
          <p className="text-lg text-muted-foreground font-body max-w-2xl leading-relaxed stagger-item" style={{ animationDelay: '100ms' }}>
            Escaneo espectral y análisis heurístico para detectar patógenos, anomalías y optimizar el rendimiento biológico.
          </p>
        </div>
        
        {/* Bio Panel Card */}
        <div className="max-w-3xl mx-auto stagger-item w-full" style={{ animationDelay: '150ms' }}>
          <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden">
            {/* Shimmer sweep effect */}
            <div className="shimmer-bio" />
            
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader className="p-6 md:p-8 pb-4 border-b border-primary/10">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 transition-transform duration-normal hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                      <Scan className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <CardTitle className="text-2xl font-display font-bold tracking-tight mb-2 text-foreground">
                        Escáner Biológico
                      </CardTitle>
                      <CardDescription className="font-body text-base leading-relaxed text-muted-foreground">
                        Sube una imagen de alta resolución para un análisis profundo de la estructura foliar y celular.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 pt-6">
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border border-primary/20 animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                        <div className="absolute inset-2 w-12 h-12 rounded-full border-2 border-secondary/60 border-b-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Dna className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      <p className="text-sm font-medium tracking-widest text-primary uppercase animate-pulse-subtle">Sincronizando red neuronal...</p>
                    </div>
                  }>
                    <SearchParamsWrapper />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick links below card */}
          <div className="mt-8 flex justify-center stagger-item" style={{ animationDelay: '200ms' }}>
            <a 
              href="/knowledge" 
              className="group flex items-center gap-4 p-5 rounded-2xl border border-primary/10 bg-background/50 backdrop-blur-md hover:bg-primary/5 hover:border-primary/40 transition-all duration-normal w-full sm:w-auto sm:max-w-[380px] shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(var(--primary),0.3)] btn-magnetic"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-normal">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-display text-base text-foreground">Base de Datos Botánica</p>
                <p className="text-sm text-muted-foreground font-body mt-0.5">Consulta de patógenos y tratamientos</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary/50 group-hover:text-primary group-hover:translate-x-2 transition-all duration-normal" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
