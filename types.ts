
export type Dimension = '2D' | '3D' | '4D' | '5D';
export type ViewType = 'BBFS' | 'DATA' | 'ARCHIVE' | 'MATRIX_BBFS' | 'MATRIX_RESULT' | 'PREDICTION';

export interface BBFSEntry {
  id: string;
  label: string;
  digits: string;
  date: string;
  result?: string;
  isCustom?: boolean;
}

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

export interface PriceDetail {
  full: number | string;
  diskon: number | string;
  super: number | string;
}

export interface PriceConfig {
  '2D': PriceDetail;
  '3D': PriceDetail;
  '4D': PriceDetail;
  '5D': PriceDetail;
}

export interface DiscountConfig {
  full: number | string;
  diskon: number | string;
  super: number | string;
}

export type DimensionDiscountConfig = Record<Dimension, DiscountConfig>;
