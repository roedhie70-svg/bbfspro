
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

export interface PriceConfig {
  '2D': number | string;
  '3D': number | string;
  '4D': number | string;
  '5D': number | string;
}

export interface DiscountConfig {
  diskon: number | string;
  super: number | string;
}

export type DimensionDiscountConfig = Record<Dimension, DiscountConfig>;
