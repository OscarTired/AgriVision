"use client";

interface WeatherErrorProps {
  error: string;
}

export function WeatherError({ error }: WeatherErrorProps) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg animate-scale-in">
      <p className="font-bold font-display">Error:</p>
      <p className="font-body text-sm mt-1">{error}</p>
    </div>
  );
}
