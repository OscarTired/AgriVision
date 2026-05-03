export type PlantStage = 'idle' | 'seedling' | 'growing' | 'weather' | 'healthy' | 'wilted' | 'error';

export interface DiagnosisPlantSceneProps {
  stage: PlantStage;
  growthProgress: number;
  showWeatherModel: boolean;
}
