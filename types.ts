
export type Dimension = '2D' | '3D' | '4D' | '5D';

export interface BBFSConfig {
  dimensions: Dimension[];
  showSingle: boolean;
  showTwin: boolean;
}

export interface SummaryRow {
  type: Dimension;
  single: number;
  twin: number;
  total: number;
}
