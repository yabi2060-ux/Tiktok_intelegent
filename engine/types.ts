export type NormalizedStatus =
  | 'paid'
  | 'in_process'
  | 'awaiting_buyer'
  | 'not_eligible'
  | 'unknown';

export interface NormalizedRecord {
  orderId: string;
  productName: string;
  sku: string;
  seller: string;
  orderDate: string;
  statusRaw: string;
  status: NormalizedStatus;
  units: number;
  gmv: number;
  estimatedCommission: number;
  actualCommission: number;
  commissionStatus: string;
  eligibilityStatus: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface FileResult {
  fileName: string;
  extension: string;
  size: number;
  valid: boolean;
  records: NormalizedRecord[];
  warnings: string[];
  errors: string[];
  sheets: string[];
  detectedHeaders: string[];
  inferredFileStatus?: NormalizedStatus;
}

export interface ParserResult {
  files: FileResult[];
  records: NormalizedRecord[];
  warnings: string[];
  errors: string[];
}

export interface DailyMetric {
  date: string;
  label: string;
  orders: number;
  units: number;
  gmv: number;
  commission: number;
}

export interface ProductMetric {
  name: string;
  units: number;
  orders: number;
  gmv: number;
  commission: number;
}

export interface SellerMetric {
  seller: string;
  units: number;
  orders: number;
  gmv: number;
  commission: number;
}

export interface StatusSummary {
  status: NormalizedStatus;
  label: string;
  orders: number;
  units: number;
  gmv: number;
  commission: number;
  uniqueProducts: number;
  uniqueSellers: number;
  skuRows: number;
  topSeller: string;
  topProduct: string;
}

export interface StatusFileSummary extends StatusSummary {
  sourceFile: string;
}

export interface PeakMetric {
  label: string;
  value: number;
  date: string;
}

export interface ReportModel {
  generatedAt: string;
  fileCount: number;
  dateStart: string;
  dateEnd: string;
  totalUnits: number;
  uniqueOrders: number;
  uniqueProducts: number;
  totalGMV: number;
  estimatedCommission: number;
  paidCommission: number;
  inProcessCommission: number;
  awaitingBuyerCommission: number;
  notEligibleCommission: number;
  statusSummaries: StatusSummary[];
  statusFileSummaries: StatusFileSummary[];
  daily: DailyMetric[];
  topProducts: ProductMetric[];
  topSellers: SellerMetric[];
  peaks: {
    orders: PeakMetric | null;
    units: PeakMetric | null;
    gmv: PeakMetric | null;
    commission: PeakMetric | null;
  };
  commissionDistribution: Array<{
    status: NormalizedStatus;
    label: string;
    amount: number;
    percentage: number;
  }>;
  risk: {
    amount: number;
    percentage: number;
    topProducts: ProductMetric[];
  };
  insight: string;
}

export interface ReportOptions {
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | 'custom';
  customWidth: number;
  customHeight: number;
  template: 'affiliate-monthly' | 'executive-dark' | 'compact-insight' | 'performance-overview';
  exportFormat: 'png' | 'json';
  reportType: 'affiliate-monthly' | 'affiliate-overview';
  visualizationMode: 'detailed' | 'compact';
  }
