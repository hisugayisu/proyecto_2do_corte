export type InvertFlag = 'true' | 'false';

export interface PredictRequest {
  invert: InvertFlag;
  image: File;
}

export interface PredictResponse {
  predicted: number;
  probabilities?: number[];
}
