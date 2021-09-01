/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable @typescript-eslint/no-empty-interface */
export const Item = (
  itemName: string,
  itemCode: string,
  itemRate: number,
  itemCategory: string,
  itemGstPercent: number
) => ({
  code: itemCode,
  name: itemName,
  rate: itemRate,
  category: itemCategory,
  gstPercent: itemGstPercent,
});

export interface Item extends ReturnType<typeof Item> {}

export const GstCategory = (
  gstId: number,
  category: string,
  description: string,
  percentage: number
) => ({
  id: gstId,
  category,
  description,
  percent: percentage,
});

export interface GstCategory extends ReturnType<typeof GstCategory> {}

export type KotTxnItemsType = {
  item_name: string;
  item_code: string;
  quantity: number;
  rate: number;
  total: number;
};

export type OpenOrderItemType = {
  item_id: number;
  item_name: string;
  item_code: string;
  item_qty: number;
  item_total: number;
  item_rate: number;
  item_gst_percent: number;
  item_gst_category: string;
  cancelled: boolean;
  printed: boolean;
  order_id: number;
  captain_name: string;
  table_number: number;
  order_type: string;
  order_status: string;
  order_kot_no: number;
  voided: boolean;
};

export const KotItemInfo = (o: OpenOrderItemType) => ({
  itemId: o.item_id,
  itemName: o.item_name,
  itemCode: o.item_code,
  itemQty: o.item_qty,
  itemRate: o.item_rate,
  itemTotal: o.item_total,
  itemGstPercent: o.item_gst_percent,
  itemGstCategory: o.item_gst_category,
  cancelled: o.cancelled,
  printed: o.printed,
  voided: o.voided,
  orderId: o.order_id,
  orderKotNo: o.order_kot_no,
  captainName: o.captain_name,
  tableNumber: o.table_number,
  orderType: o.order_type,
  orderStatus: o.order_status,
});

export interface KotItemInfo extends ReturnType<typeof KotItemInfo> {}

export const AggregateItemInfo = (
  item_code: string,
  item_name: string,
  item_qty: number,
  item_rate: number,
  item_total: number
) => ({
  itemCode: item_code,
  itemName: item_name,
  itemQty: item_qty,
  itemRate: item_rate,
  itemTotal: item_total,
});

export interface AggregateItemInfo
  extends ReturnType<typeof AggregateItemInfo> {}

export const BillAmountInfo = (
  total: number,
  preDiscountFoodTotal: number,
  taxOnFood: number,
  liquorAmount: number,
  beerAmount: number,
  discountPercent: number,
  discountAmount: number,
  nonTaxableAmount: number,
  taxableAmount: number,
  cgstAmount: number,
  sgstAmount: number,
  totalTaxAmount: number,
  grandTotal: number
) => ({
  total,
  preDiscountFoodTotal,
  taxOnFood,
  liquorAmount,
  beerAmount,
  discountPercent,
  discountAmount,
  nonTaxableAmount,
  taxableAmount,
  cgstAmount,
  sgstAmount,
  totalTaxAmount,
  grandTotal,
});

export interface BillAmountInfo extends ReturnType<typeof BillAmountInfo> {}

export const OriginalBillInfo = (
  billDate: string,
  billTime: string,
  orderId: number,
  captainName: string,
  tableNumber: number
) => ({
  billDate,
  billTime,
  orderId,
  captainName,
  tableNumber,
});

export interface OriginalBillInfo extends ReturnType<typeof OriginalBillInfo> {}

export const BillInfoItem = (
  itemName: string,
  itemCode: string,
  quantity: number,
  rate: number,
  total: number,
  gstPercent: number,
  gstCategory: string
) => ({
  itemName,
  itemCode,
  qty: quantity,
  rate,
  total,
  gstPercent,
  gstCategory,
});

export interface BillInfoItem extends ReturnType<typeof BillInfoItem> {}

export const PendingBillInfo = (
  billId: string,
  billNo: number,
  captainName: string,
  tableNumber: number,
  orderType: string,
  orderId: number,
  billTotal: number,
  billGrandTotal: number
) => ({
  billId,
  billNo,
  captainName,
  tableNumber,
  orderType,
  orderId,
  billTotal,
  billGrandTotal,
});

export interface PendingBillInfo extends ReturnType<typeof PendingBillInfo> {}

export const RoomGuestInfo = (
  roomNo: number,
  firstName: string,
  lastName: string,
  contact: string,
  foodBillType: string,
  checkinInfoId: number,
  checkInNumber: string,
  packageFoodAllowance: number,
  gstNumber: string,
  notes: string
) => ({
  roomNo,
  firstName,
  lastName,
  contact,
  foodBillType,
  checkinInfoId,
  checkInNumber,
  packageFoodAllowance,
  gstNumber,
  notes,
});

export interface RoomGuestInfo extends ReturnType<typeof RoomGuestInfo> {}

export const ReportInfo = (
  startDateStr: string,
  startDate: Date,
  curReportId: number,
  curReportDateStr: string,
  curReportDate: Date,
  lastDateStr: string | undefined,
  lastDate: Date | undefined,
  count: number
) => ({
  startDateStr,
  startDate,
  curReportId,
  curReportDateStr,
  curReportDate,
  lastDateStr,
  lastDate,
  count,
});

export interface ReportInfo extends ReturnType<typeof ReportInfo> {}

export const VoidReportItems = (
  itemName: string,
  itemRate: number,
  itemQty: number,
  tableNumber: number,
  kotNo: number,
  captainName: string
) => ({
  itemName,
  itemRate,
  itemQty,
  tableNumber,
  kotNo,
  captainName,
});

export interface VoidReportItems extends ReturnType<typeof VoidReportItems> {}

export const ItemWiseReportItem = (
  itemName: string,
  quantity: number,
  category: string
) => ({
  itemName,
  quantity,
  category,
});

export interface ItemWiseReportItem
  extends ReturnType<typeof ItemWiseReportItem> {}

export const ConsolidatedReportItem = (
  billNo: number,
  billId: string,
  roomNo: number,
  paymentType: string,
  billTotal: number,
  grandTotal: number,
  totalTaxAmount: number,
  preDiscountFoodAmount: number,
  liquorAmount: number,
  beerAmount: number,
  cgstAmount: number,
  sgstAmount: number,
  taxableAmount: number,
  nonTaxableAmount: number,
  discountAmount: number,
  tableNumber: number,
  orderStatus: string,
  orderId: number
) => ({
  billNo,
  billId,
  roomNo,
  paymentType,
  billTotal,
  grandTotal,
  foodAmount: preDiscountFoodAmount,
  liquorAmount,
  beerAmount,
  cgstAmount,
  sgstAmount,
  totalTaxAmount,
  taxableAmount,
  nonTaxableAmount,
  discountAmount,
  tableNumber,
  orderStatus,
  orderId,
});

export interface ConsolidatedReportItem
  extends ReturnType<typeof ConsolidatedReportItem> {}

export const AdminPasswordDoc = (id: string, hash: string, rev: string) => ({
  _id: id,
  password_hash: hash,
  _rev: rev,
});

export interface AdminPasswordDoc extends ReturnType<typeof AdminPasswordDoc> {}
