"use client";

import type { DiagnoseCropDiseaseOutput } from "@/ai/flows/diagnose-crop-disease";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, Thermometer, ShieldCheck, ListChecks, Play, Square, Loader2, FileText, Leaf } from "lucide-react";
import { DiagnosisChatPanel } from "@/components/diagnosis/DiagnosisChatPanel";

interface DiagnosisResultCardProps {
  result: DiagnoseCropDiseaseOutput;
  isPlayingRecommendations: boolean;
  onSpeak: (recommendations: string[]) => void;
  onStopSpeaking: () => void;
  // Chat props
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  isSendingMessage: boolean;
  reasoningSteps: string[];
  currentStepIndex: number;
  chatMessages: Array<{ role: string; content: string }>;
  chatLoading: boolean;
  onSendMessage: () => void;
  onChatKeyPress: (e: React.KeyboardEvent) => void;
}

export function DiagnosisResultCard({
  result,
  isPlayingRecommendations,
  onSpeak,
  onStopSpeaking,
  showChat,
  setShowChat,
  chatInput,
  setChatInput,
  isSendingMessage,
  reasoningSteps,
  currentStepIndex,
  chatMessages,
  chatLoading,
  onSendMessage,
  onChatKeyPress,
}: DiagnosisResultCardProps) {
  return (
    <Card className="mt-8 shadow-lg animate-scale-in overflow-hidden">
      {/* Animated accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
      <CardHeader>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <CardTitle className="text-2xl font-display font-semibold flex items-center gap-2 tracking-tight">
            <ShieldCheck className="text-primary animate-float" style={{ animationDuration: '4s' }} />
            Resultado del Diagnóstico
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSpeak(result.recommendations)}
              disabled={isPlayingRecommendations}
              className="flex items-center gap-2 flex-shrink-0 btn-press"
            >
              {isPlayingRecommendations ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Reproduciendo...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Reproducir</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStopSpeaking}
              disabled={!isPlayingRecommendations}
              className="flex items-center gap-2 flex-shrink-0 btn-press"
            >
              <Square className="w-4 h-4" />
              <span className="hidden sm:inline">Detener</span>
            </Button>
          </div>
        </div>
        <CardDescription>Análisis del estado de su cultivo impulsado por Inteligencia Artificial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Plant Identification */}
        {result.plantIdentification && (
          <div className={`rounded-lg border p-4 stagger-item ${result.plantIdentification.isRaspberry ? 'border-primary/40 bg-primary/10' : 'border-destructive/40 bg-destructive/10'}`}>
            <div className="flex items-start gap-3">
              <Leaf className={`w-5 h-5 ${result.plantIdentification.isRaspberry ? 'text-primary' : 'text-destructive'}`} />
              <h3 className="font-semibold font-display">Identificación de Planta</h3>
              <Badge variant={result.plantIdentification.isRaspberry ? "default" : "destructive"} className="ml-auto">
                {Math.round(result.plantIdentification.confidence * 100)}% confianza
              </Badge>
            </div>
            <p className="text-sm font-body">
              {result.plantIdentification.isRaspberry
                ? `Planta identificada: ${result.plantIdentification.detectedPlant}`
                : `No es frambuesa: ${result.plantIdentification.detectedPlant}`
              }
            </p>
          </div>
        )}

        <div className="stagger-item">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-display"><Info className="text-accent" />Enfermedad/Problema Identificado:</h3>
          <p className="text-lg font-display tracking-tight">{result.diseaseName}</p>
        </div>

        <div className="stagger-item">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-display"><Thermometer className="text-accent" />Nivel de Confianza:</h3>
          <div className="flex items-center gap-2">
            <Progress value={result.confidence * 100} className="w-full h-3" />
            <span className="font-display font-semibold">{(result.confidence * 100).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-body">Este porcentaje indica la seguridad de la IA en su diagnóstico.</p>
        </div>

        <div className="stagger-item">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-display"><ListChecks className="text-accent" />Síntomas Observados:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1 font-body">
            {result.symptoms.map((symptom, index) => (
              <li key={index}>{symptom}</li>
            ))}
          </ul>
        </div>

        <div className="stagger-item">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-display"><CheckCircle className="text-accent" />Recomendaciones para el Manejo:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1 font-body">
            {result.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* RAG-enriched recommendations */}
        {result.enrichedRecommendations && result.enrichedRecommendations.length > 0 && (
          <div className="stagger-item">
            <h3 className="text-lg font-semibold flex items-center gap-2 font-display">
              <FileText className="text-accent" />Recomendaciones de Manuales Técnicos:
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-1 font-body">
              {result.enrichedRecommendations.map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* RAG Sources */}
        {result.ragSources && result.ragSources.length > 0 && (
          <div className="stagger-item">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 font-body">Fuentes consultadas:</h3>
            <div className="flex flex-wrap gap-1">
              {result.ragSources.map((src, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal py-1 font-body transition-all duration-normal hover:scale-105 hover:shadow-sm cursor-default" title={src.snippet}>
                  <FileText className="w-3 h-3 mr-1" />
                  {src.source} — p.{src.page} ({src.relevance}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        <DiagnosisChatPanel
          showChat={showChat}
          setShowChat={setShowChat}
          chatInput={chatInput}
          setChatInput={setChatInput}
          isSendingMessage={isSendingMessage}
          reasoningSteps={reasoningSteps}
          currentStepIndex={currentStepIndex}
          chatMessages={chatMessages}
          chatLoading={chatLoading}
          onSendMessage={onSendMessage}
          onChatKeyPress={onChatKeyPress}
        />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground font-body">
        <p>Este diagnóstico es una herramienta de apoyo. Para decisiones cruciales, consulte siempre a un agrónomo local.</p>
      </CardFooter>
    </Card>
  );
}
