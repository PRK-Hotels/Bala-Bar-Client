import {
  printer as ThermalPrinter,
  types as Types,
} from 'node-thermal-printer';

import moment from 'moment';
import ElectronStore from 'electron-store';

import { BillAmountInfo, AggregateItemInfo } from '../../shared';

const store = new ElectronStore();

const defaultSettings = {
  type: Types.EPSON, // 'star' or 'epson'
  interface: '',
  options: {
    timeout: 1000,
  },
  width: 47, // Number of characters in one line - default: 48
  characterSet: 'SLOVENIA', // Character set - default: SLOVENIA
  removeSpecialCharacters: false, // Removes special characters - default: false
  lineCharacter: '-', // Use custom character for drawing lines - default: -
};

export const printKot = (
  captainName: string,
  kotNumber: number,
  tableNumber: number,
  items: AggregateItemInfo[]
): ThermalPrinter => {
  const printerIP: string = (store.get('PrinterIP') as string) || '10.0.0.1';
  const printer = new ThermalPrinter({
    ...defaultSettings,
    interface: `tcp://${printerIP}`,
  });

  printer.alignLeft();
  printer.tableCustom([
    { text: '', align: 'LEFT', width: 0.05 },
    {
      text: `KOT No: ${kotNumber.toString()}`,
      align: 'LEFT',
      width: 0.25,
      bold: true,
    },
    { text: 'KOT', align: 'CENTER', width: 0.3, bold: true },
    { text: moment().format('DD-MM-YYYY'), align: 'RIGHT', width: 0.4 },
  ]);
  printer.tableCustom([
    { text: '', width: 0.1 },
    {
      text: `Cap: ${captainName.substring(0, 10)}`,
      align: 'CENTER',
      width: 0.6,
      bold: true,
    },
    { text: '', width: 0.1 },
  ]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: `Table #: ${tableNumber}`, align: 'LEFT', width: 0.4 },
    { text: moment().format('hh:mm:ss a'), align: 'RIGHT', width: 0.55 },
  ]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: 'Item Name', align: 'LEFT', width: 0.85 },
    { text: 'Qty', align: 'LEFT', width: 0.1 },
  ]);
  printer.drawLine();
  printer.setTextDoubleHeight();
  items.forEach((item, index) => {
    const itemName = item.itemName.substring(0, 30);
    const itemQty = item.itemQty.toString();

    printer.tableCustom([
      { text: '', width: 0.05 },
      { text: itemName, align: 'LEFT', width: 0.85, bold: true },
      { text: itemQty, align: 'LEFT', width: 0.1 },
    ]);

    if (index < items.length - 1) {
      printer.newLine();
    }
  });
  printer.setTextNormal();
  // printer.cut();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();

  return printer;
};

export const printVoidKot = (
  tableNumber: number,
  items: AggregateItemInfo[]
): ThermalPrinter => {
  const printerIP: string = (store.get('PrinterIP') as string) || '10.0.0.1';
  const printer = new ThermalPrinter({
    ...defaultSettings,
    interface: `tcp://${printerIP}`,
  });

  printer.alignLeft();
  printer.tableCustom([
    { text: '', width: 0.28 },
    { text: 'Void KOT', align: 'CENTER', width: 0.3, bold: true },
    { text: moment().format('DD-MM-YYYY'), align: 'RIGHT', width: 0.4 },
  ]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: `Table #: ${tableNumber}`, align: 'LEFT', width: 0.4 },
    { text: moment().format('hh:mm:ss a'), align: 'RIGHT', width: 0.55 },
  ]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: 'Item Name', align: 'LEFT', width: 0.85 },
    { text: 'Qty', align: 'LEFT', width: 0.1 },
  ]);
  printer.drawLine();
  items.forEach((item, index) => {
    const itemName = item.itemName.substring(0, 30);
    const itemQty = item.itemQty.toString();

    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.05 },
      { text: itemName, align: 'LEFT', width: 0.85 },
      { text: itemQty, align: 'LEFT', width: 0.1 },
    ]);

    if (index < items.length - 1) {
      printer.newLine();
    }
  });
  // printer.cut();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();

  return printer;
};

export const printKotReport = (
  items: AggregateItemInfo[],
  tableNumber: number
): ThermalPrinter => {
  const printerIP: string = (store.get('PrinterIP') as string) || '10.0.0.1';
  const printer = new ThermalPrinter({
    ...defaultSettings,
    interface: `tcp://${printerIP}`,
  });

  printer.alignLeft();
  printer.tableCustom([{ text: 'Report', align: 'CENTER', bold: true }]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: `Table #: ${tableNumber}`, align: 'LEFT', width: 0.4 },
    { text: moment().format('DD-MM-YYYY'), align: 'RIGHT', width: 0.55 },
  ]);
  printer.newLine();
  printer.tableCustom([
    { text: '', width: 0.05 },
    { text: 'Item Name', align: 'LEFT', width: 0.85 },
    { text: 'Qty', align: 'LEFT', width: 0.1 },
  ]);
  printer.drawLine();

  items.forEach((item, ind) => {
    const itemName = item.itemName || '';
    const itemQty = (item.itemQty || 0).toString();

    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.05 },
      { text: itemName, align: 'LEFT', width: 0.85 },
      { text: itemQty, align: 'LEFT', width: 0.1 },
    ]);

    if (ind < items.length - 1) {
      printer.newLine();
    }
  });
  // printer.cut();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();

  return printer;
};

const printBillHelper = (
  billId: string,
  tableNo: number,
  billDate: string,
  billTime: string,
  foodItems: AggregateItemInfo[],
  nonFoodItems: AggregateItemInfo[],
  billAmountInfo: BillAmountInfo,
  printer: ThermalPrinter
): ThermalPrinter => {
  const foodTotal = Math.ceil(
    billAmountInfo.taxableAmount +
      billAmountInfo.cgstAmount +
      billAmountInfo.sgstAmount
  );

  const discountOnFood =
    billAmountInfo.preDiscountFoodTotal - billAmountInfo.taxableAmount;
  const discountOnAlcohol = billAmountInfo.discountAmount - discountOnFood;
  const alcoholSubTotal =
    billAmountInfo.beerAmount + billAmountInfo.liquorAmount;
  const alcoholTotalAfterDiscount = alcoholSubTotal - discountOnAlcohol;

  // --------------------------------------------  Food Bill  -------------------------------------------------------------
  if (foodItems.length > 0) {
    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.02 },
      { text: 'GSTIN: 29AAHFR9721Q1Z9', align: 'LEFT', width: 0.48 },
      { text: '', align: 'CENTER', width: 0.1 },
      { text: 'HSN Code: 996332', align: 'RIGHT', width: 0.4 },
    ]);
    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.02 },
      { text: `Bill #: ${billId}`, align: 'LEFT', width: 0.48 },
      { text: `Date:${billDate}`, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.02 },
      { text: `Table #: ${tableNo}`, align: 'LEFT', width: 0.28 },
      { text: 'Food Bill', align: 'CENTER', width: 0.3 },
      { text: `Time:${billTime}`, align: 'RIGHT', width: 0.4 },
    ]);
    printer.drawLine();
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Item Name', align: 'LEFT', width: 0.55 },
      { text: 'Rate', align: 'LEFT', width: 0.1 },
      { text: 'Qty', align: 'RIGHT', width: 0.1 },
      { text: 'Amt', align: 'RIGHT', width: 0.23 },
    ]);
    printer.drawLine();
    foodItems.forEach((item, ind) => {
      const itemName = item.itemName.substring(0, 25);

      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: itemName, align: 'LEFT', width: 0.55 },
        { text: item.itemRate.toString(), align: 'LEFT', width: 0.1 },
        { text: item.itemQty.toString(), align: 'RIGHT', width: 0.1 },
        { text: item.itemTotal.toString(), align: 'RIGHT', width: 0.23 },
      ]);

      if (ind < foodItems.length - 1) {
        printer.newLine();
      }
    });
    printer.drawLine();
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Sub Total', align: 'RIGHT', width: 0.48, bold: true },
      {
        text: billAmountInfo.preDiscountFoodTotal.toString(),
        align: 'RIGHT',
        width: 0.48,
      },
      { text: '', width: 0.02 },
    ]);
    if (billAmountInfo.discountAmount > 0) {
      printer.tableCustom([
        { text: '', width: 0.02 },
        {
          text: `After ${billAmountInfo.discountPercent}% Discount`,
          align: 'RIGHT',
          width: 0.48,
          bold: true,
        },
        {
          text: billAmountInfo.taxableAmount.toFixed(3),
          align: 'RIGHT',
          width: 0.48,
        },
        { text: '', width: 0.02 },
      ]);
    }
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'C-GST @ 2.5%', align: 'RIGHT', width: 0.48, bold: true },
      {
        text: billAmountInfo.cgstAmount.toFixed(3),
        align: 'RIGHT',
        width: 0.48,
      },
      { text: '', width: 0.02 },
    ]);
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'S-GST @ 2.5%', align: 'RIGHT', width: 0.48, bold: true },
      {
        text: billAmountInfo.sgstAmount.toFixed(3),
        align: 'RIGHT',
        width: 0.48,
      },
      { text: '', width: 0.02 },
    ]);
    printer.newLine();
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Total (Rs)', align: 'RIGHT', width: 0.48, bold: true },
      { text: foodTotal.toString(), align: 'RIGHT', width: 0.48, bold: true },
      { text: '', width: 0.02 },
    ]);

    if (nonFoodItems.length === 0) {
      printer.newLine();
      printer.tableCustom([
        { text: '', width: 0.1 },
        { text: 'THANK YOU VISIT AGAIN', align: 'CENTER', width: 0.8 },
        { text: '', width: 0.1 },
      ]);
    }

    // --------------------------------------------  Beverage Bill  -------------------------------------------------------------
    if (nonFoodItems.length > 0) {
      printer.newLine();
      printer.newLine();

      printer.tableCustom([
        { text: '', align: 'LEFT', width: 0.02 },
        { text: `Bill #: ${billId}`, align: 'LEFT', width: 0.28 },
        { text: `Date:${billDate}`, align: 'RIGHT', width: 0.7 },
      ]);
      printer.tableCustom([
        { text: '', align: 'LEFT', width: 0.02 },
        { text: `Table #: ${tableNo}`, align: 'LEFT', width: 0.28 },
        { text: 'Beverage Bill', align: 'CENTER', width: 0.3 },
        { text: `Time:${billTime}`, align: 'RIGHT', width: 0.4 },
      ]);
      printer.drawLine();
      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: 'Item Name', align: 'LEFT', width: 0.55 },
        { text: 'Rate', align: 'LEFT', width: 0.1 },
        { text: 'Qty', align: 'RIGHT', width: 0.1 },
        { text: 'Amt', align: 'RIGHT', width: 0.23 },
      ]);
      printer.drawLine();
      nonFoodItems.forEach((item, ind) => {
        const itemName = item.itemName.substring(0, 25);

        printer.tableCustom([
          { text: '', width: 0.02 },
          { text: itemName, align: 'LEFT', width: 0.55 },
          { text: item.itemRate.toString(), align: 'LEFT', width: 0.1 },
          { text: item.itemQty.toString(), align: 'RIGHT', width: 0.1 },
          { text: item.itemTotal.toString(), align: 'RIGHT', width: 0.23 },
        ]);

        if (ind < nonFoodItems.length - 1) {
          printer.newLine();
        }
      });
      printer.drawLine();
      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: 'Sub Total', align: 'RIGHT', width: 0.48, bold: true },
        { text: alcoholSubTotal.toString(), align: 'RIGHT', width: 0.48 },
        { text: '', width: 0.02 },
      ]);
      if (billAmountInfo.discountAmount > 0) {
        printer.tableCustom([
          { text: '', width: 0.02 },
          {
            text: `After ${billAmountInfo.discountPercent}% Discount`,
            align: 'RIGHT',
            width: 0.48,
            bold: true,
          },
          {
            text: alcoholTotalAfterDiscount.toFixed(3),
            align: 'RIGHT',
            width: 0.48,
          },
          { text: '', width: 0.02 },
        ]);
      }
      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: 'Total (Rs)', align: 'RIGHT', width: 0.48, bold: true },
        {
          text: billAmountInfo.nonTaxableAmount.toString(),
          align: 'RIGHT',
          width: 0.48,
        },
        { text: '', width: 0.02 },
      ]);
      printer.newLine();
      printer.newLine();
      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: 'GRAND TOTAL (Rs):', align: 'RIGHT', width: 0.58, bold: true },
        {
          text: billAmountInfo.grandTotal.toString(),
          align: 'RIGHT',
          width: 0.38,
          bold: true,
        },
        { text: '', width: 0.02 },
      ]);
      printer.tableCustom([
        { text: '', width: 0.1 },
        { text: 'THANK YOU VISIT AGAIN', align: 'CENTER', width: 0.8 },
        { text: '', width: 0.1 },
      ]);
    }
  } else {
    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.02 },
      { text: `Bill #: ${billId}`, align: 'LEFT', width: 0.28 },
      { text: `Date:${billDate}`, align: 'RIGHT', width: 0.7 },
    ]);
    printer.tableCustom([
      { text: '', align: 'LEFT', width: 0.02 },
      { text: `Table #: ${tableNo}`, align: 'LEFT', width: 0.28 },
      { text: 'Beverage Bill', align: 'CENTER', width: 0.3 },
      { text: `Time:${billTime}`, align: 'RIGHT', width: 0.4 },
    ]);
    printer.drawLine();
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Item Name', align: 'LEFT', width: 0.55 },
      { text: 'Rate', align: 'LEFT', width: 0.1 },
      { text: 'Qty', align: 'RIGHT', width: 0.1 },
      { text: 'Amt', align: 'RIGHT', width: 0.23 },
    ]);
    printer.drawLine();
    nonFoodItems.forEach((item, ind) => {
      const itemName = item.itemName.substring(0, 25);

      printer.tableCustom([
        { text: '', width: 0.02 },
        { text: itemName, align: 'LEFT', width: 0.55 },
        { text: item.itemRate.toString(), align: 'LEFT', width: 0.1 },
        { text: item.itemQty.toString(), align: 'RIGHT', width: 0.1 },
        { text: item.itemTotal.toString(), align: 'RIGHT', width: 0.23 },
      ]);

      if (ind < nonFoodItems.length - 1) {
        printer.newLine();
      }
    });
    printer.drawLine();
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Sub Total', align: 'RIGHT', width: 0.48, bold: true },
      { text: alcoholSubTotal.toString(), align: 'RIGHT', width: 0.48 },
      { text: '', width: 0.02 },
    ]);
    if (billAmountInfo.discountAmount > 0) {
      printer.tableCustom([
        { text: '', width: 0.02 },
        {
          text: `After ${billAmountInfo.discountPercent}% Discount`,
          align: 'RIGHT',
          width: 0.48,
          bold: true,
        },
        {
          text: alcoholTotalAfterDiscount.toFixed(3),
          align: 'RIGHT',
          width: 0.48,
        },
        { text: '', width: 0.02 },
      ]);
    }
    printer.tableCustom([
      { text: '', width: 0.02 },
      { text: 'Total (Rs)', align: 'RIGHT', width: 0.48, bold: true },
      {
        text: billAmountInfo.nonTaxableAmount.toString(),
        align: 'RIGHT',
        width: 0.48,
      },
      { text: '', width: 0.02 },
    ]);
    printer.newLine();
    printer.tableCustom([
      { text: '', width: 0.1 },
      { text: 'THANK YOU VISIT AGAIN', align: 'CENTER', width: 0.8 },
      { text: '', width: 0.1 },
    ]);
  }
  // printer.cut();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.newLine();
  return printer;
};

export const printBill = (
  billId: string,
  tableNo: number,
  billDate: string,
  billTime: string,
  foodItems: AggregateItemInfo[],
  nonFood: AggregateItemInfo[],
  billAmountInfo: BillAmountInfo
): ThermalPrinter => {
  const printerIP: string = (store.get('PrinterIP') as string) || '10.0.0.1';
  const printer = new ThermalPrinter({
    ...defaultSettings,
    interface: `tcp://${printerIP}`,
  });

  printer.alignLeft();
  printer.tableCustom([
    { text: '', align: 'LEFT', width: 0.1 },
    { text: 'ROCK GARDEN', align: 'CENTER', width: 0.8, bold: true },
    { text: '', align: 'LEFT', width: 0.1 },
  ]);
  printer.tableCustom([
    { text: '', align: 'LEFT', width: 0.1 },
    { text: 'Infantry Road, Bellary', align: 'CENTER', width: 0.8, bold: true },
    { text: '', align: 'LEFT', width: 0.1 },
  ]);
  printer.newLine();

  return printBillHelper(
    billId,
    tableNo,
    billDate,
    billTime,
    foodItems,
    nonFood,
    billAmountInfo,
    printer
  );
};

export const printDuplicateBill = (
  billId: string,
  tableNo: number,
  billDate: string,
  billTime: string,
  foodItems: AggregateItemInfo[],
  nonFoodItems: AggregateItemInfo[],
  billAmountInfo: BillAmountInfo
): ThermalPrinter => {
  const printerIP: string = (store.get('PrinterIP') as string) || '10.0.0.1';
  const printer = new ThermalPrinter({
    ...defaultSettings,
    interface: `tcp://${printerIP}`,
  });

  printer.alignLeft();
  printer.tableCustom([
    { text: '', align: 'LEFT', width: 0.1 },
    { text: 'ROCK GARDEN', align: 'CENTER', width: 0.8, bold: true },
    { text: '', align: 'LEFT', width: 0.1 },
  ]);
  printer.tableCustom([
    { text: '', align: 'LEFT', width: 0.1 },
    { text: 'Infantry Road, Bellary', align: 'CENTER', width: 0.8, bold: true },
    { text: '', align: 'LEFT', width: 0.1 },
  ]);
  printer.newLine();

  return printBillHelper(
    billId,
    tableNo,
    billDate,
    billTime,
    foodItems,
    nonFoodItems,
    billAmountInfo,
    printer
  );
};
