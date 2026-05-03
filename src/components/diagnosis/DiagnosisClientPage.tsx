"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useDiagnosis } from "@/hooks/use-diagnosis";
import { DiagnosisForm } from "./DiagnosisForm";
import { DiagnosisResultCard } from "./DiagnosisResultCard";

const DiagnosisPlantScene = dynamic(
  () => import("@/components/three/DiagnosisPlantScene").then((mod) => mod.DiagnosisPlantScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] w-full rounded-2xl border border-border/30 bg-gradient-to-b from-primary/8 via-background to-primary/3 md:h-[560px] lg:h-[620px] shadow-2xl" />
    ),
  }
);

interface DiagnosisClientPageProps {
  sessionId?: string;
}

export function DiagnosisClientPage({ sessionId }: DiagnosisClientPageProps = {}) {
  const d = useDiagnosis(sessionId);

  return (
    <div className="relative space-y-8 w-full max-w-4xl mx-auto px-4 md:px-0 min-w-0 overflow-hidden">
      {/* ─── Upload Form Card ─── */}
      <Card className="shadow-xl overflow-hidden bg-background border-border/60 w-full min-w-0">
        <CardHeader className="relative bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground p-6 pb-5 noise-overlay">
          <div className="relative z-10">
            <CardTitle className="text-3xl font-display font-bold flex items-center gap-3 tracking-tight animate-slide-down-fade">
              <ShieldCheck className="w-8 h-8 flex-shrink-0" /> Diagnóstico de Cultivos
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 mt-2 font-body animate-fade-in" style={{ animationDelay: '100ms' }}>
              Utilice nuestra herramienta con Inteligencia Artificial para identificar problemas en sus cultivos.
              Suba una imagen clara y bríndenos algunos detalles.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-hidden">
          <DiagnosisForm
            form={d.form}
            onSubmit={d.onSubmit}
            isLoading={d.isLoading}
            imagePreview={d.imagePreview}
            handleImageChange={d.handleImageChange}
            handleRemoveImage={d.handleRemoveImage}
            gettingLocation={d.gettingLocation}
            handleGetLocation={d.handleGetLocation}
            hasLocation={!!d.location}
          />
        </CardContent>
      </Card>

      {/* ─── 3D Ecosystem ─── */}
      <div className="w-full min-w-0">
        <DiagnosisPlantScene
          stage={d.plantStage}
          growthProgress={d.growthProgress}
          showWeatherModel={d.showWeatherModel}
        />
      </div>

      {/* ─── Error Alert ─── */}
      {d.error && (
        <Alert variant="destructive" className="mt-6 animate-scale-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{d.error}</AlertDescription>
        </Alert>
      )}

      {/* ─── Diagnosis Result ─── */}
      {d.diagnosisResult && (
        <DiagnosisResultCard
          result={d.diagnosisResult}
          isPlayingRecommendations={d.isPlayingRecommendations}
          onSpeak={d.speakRecommendations}
          onStopSpeaking={d.stopSpeaking}
          showChat={d.showChat}
          setShowChat={d.setShowChat}
          chatInput={d.chatInput}
          setChatInput={d.setChatInput}
          isSendingMessage={d.isSendingMessage}
          reasoningSteps={d.reasoningSteps}
          currentStepIndex={d.currentStepIndex}
          chatMessages={d.chatMessages}
          chatLoading={d.chatLoading}
          onSendMessage={d.handleSendMessage}
          onChatKeyPress={d.handleChatKeyPress}
        />
      )}
    </div>
  );
}
