"use client";

import { Sparkles, Brain, Leaf, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface AIRecommendationsSectionProps {
  loading: boolean;
  recommendations: string[] | null;
}

const THINKING_STEPS = [
  { icon: Brain, label: "Analizando datos climáticos", color: "text-primary" },
  { icon: Leaf, label: "Evaluando impacto en cultivos", color: "text-accent" },
  { icon: ShieldCheck, label: "Generando recomendaciones", color: "text-secondary" },
];

export function AIRecommendationsSection({ loading, recommendations }: AIRecommendationsSectionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setActiveStep(0);
      setProgress(0);
      return;
    }

    // Cycle through steps
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 2400);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev + 0.1;
        return prev + 1.2;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Main loading card */}
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 overflow-hidden">
          {/* Animated shimmer overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 50%, transparent 100%)",
              animation: "shimmer-sweep 2s ease-in-out infinite",
            }}
          />

          <div className="relative z-10">
            {/* Header with animated icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-display">
                  Inteligencia Artificial trabajando
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Analizando condiciones para frambuesa Heritage
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-muted/50 mb-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(progress, 95)}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)))",
                  backgroundSize: "200% 100%",
                  animation: "iridescent-shift 3s ease infinite",
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {THINKING_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === activeStep;
                const isCompleted = i < activeStep;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${
                      isActive
                        ? "bg-primary/8 border border-primary/15"
                        : isCompleted
                        ? "opacity-60"
                        : "opacity-30"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isActive
                          ? "bg-primary/15 scale-110"
                          : isCompleted
                          ? "bg-muted/50"
                          : "bg-muted/30"
                      }`}
                    >
                      <StepIcon
                        className={`w-3.5 h-3.5 transition-all duration-500 ${
                          isActive
                            ? `${step.color} animate-pulse`
                            : "text-muted-foreground/50"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-body transition-all duration-500 ${
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {step.label}
                      {isActive && (
                        <span className="inline-flex ml-1.5 gap-0.5">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={dot}
                              className="inline-block w-1 h-1 rounded-full bg-primary"
                              style={{
                                animation: `pulse 1.2s ease-in-out ${dot * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skeleton preview lines */}
        <div className="space-y-2.5 px-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="mt-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/15 flex-shrink-0"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div
                className="h-3.5 rounded-md bg-muted-foreground/8 flex-1"
                style={{
                  width: `${65 + (i % 3) * 12}%`,
                  animation: `pulse 2s ease-in-out ${i * 150}ms infinite`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <p className="text-muted-foreground font-body text-sm">No hay recomendaciones disponibles.</p>
    );
  }

  return (
    <ul className="list-none space-y-3">
      {recommendations.map((rec, index) => (
        <li
          key={index}
          className="flex gap-3 text-base stagger-item"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.8)]" />
          <span className="font-body text-foreground/90">{rec}</span>
        </li>
      ))}
    </ul>
  );
}
