export type TopupCategory =
  | "PULSA"
  | "PAKET_DATA"
  | "EMONEY"
  | "PLN_TOKEN"
  | "INTERNET_BILL";

export type FlowType = "PREPAID" | "POSTPAID";
export type NominalType = "FIXED" | "VARIABLE";
export type TopupTransactionStatus = "SUBMITTED" | "PENDING" | "SUCCESS" | "FAILED";
export type TopupInquiryStatus = "CHECKED" | "USED" | "EXPIRED";

export interface TopupProduct {
  id: string;
  sku: string;
  name: string;
  category: TopupCategory;
  brand: string;
  flow_type: FlowType;
  nominal_type: NominalType;
  catalog_price: number;
  catalog_admin: number;
  catalog_commission: number;
  seller_name: string | null;
  is_active: boolean;
  description: string | null;
  source_updated_at: Date | null;
  imported_at: Date;
  limits?: TopupProductLimits | null;
}

export interface TopupProductLimits {
  id: string;
  product_id: string;
  min_amount: number;
  max_amount: number;
  increment_amount: number;
  currency: string;
}

export interface TopupInquiry {
  id: string;
  supplier_ref_id: string;
  product_id: string | null;
  sku: string;
  category: TopupCategory;
  customer_target: string;
  customer_name: string | null;
  input_amount: number | null;
  final_price: number;
  deposit_price: number;
  admin_fee: number;
  commission: number;
  bill_period: string | null;
  detail_snapshot: any;
  status: TopupInquiryStatus;
  inquiry_date: string; // YYYY-MM-DD
  operator_username: string;
  raw_response: any;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TopupTransaction {
  reference: string;
  product_id: string | null;
  inquiry_id: string | null;
  idempotency_key: string;
  category: TopupCategory;
  flow_type: FlowType;
  customer_target: string;
  product_snapshot: {
    name: string;
    sku: string;
    category: string;
    brand: string;
    nominal_type?: string;
  };
  final_price_snapshot: number;
  deposit_price_snapshot: number;
  admin_snapshot: number;
  commission_snapshot: number;
  status: TopupTransactionStatus;
  operator_username: string;
  supplier_reference: string | null;
  serial_number: string | null;
  token: string | null;
  supplier_message: string | null;
  raw_response: any;
  submitted_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SupplierResult {
  success: boolean;
  status: TopupTransactionStatus;
  rc?: string;
  message: string;
  sn?: string | null;
  token?: string | null;
  price?: number;
  selling_price?: number;
  raw: any;
}

export interface BillInquiryResult {
  success: boolean;
  rc?: string;
  message: string;
  customer_no: string;
  customer_name: string;
  bill_period?: string;
  admin?: number;
  commission?: number;
  price: number; // Deposit cost
  selling_price: number; // Final customer price
  details?: any;
  raw: any;
}

export interface PlnInquiryResult {
  success: boolean;
  rc?: string;
  message: string;
  customer_no: string;
  meter_no?: string;
  subscriber_id?: string;
  name: string;
  segment_power?: string;
  raw: any;
}
