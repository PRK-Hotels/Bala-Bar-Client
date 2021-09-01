import {
  KotItemInfo,
  OpenOrderItemType,
  AggregateItemInfo,
  KotTxnItemsType,
} from '../../shared';

export const ItemPrintAggregator = (items: KotItemInfo[]) => {
  const aggregateItems = Array<AggregateItemInfo>();

  if (items && Array.isArray(items) && items.length > 0) {
    items
      .reduce((obj, item) => {
        const code = item.itemCode;
        let agItem = obj.get(code);

        if (agItem) {
          agItem = AggregateItemInfo(
            code,
            agItem.itemName,
            agItem.itemQty + item.itemQty,
            agItem.itemRate,
            agItem.itemTotal + item.itemTotal
          );
        } else {
          agItem = AggregateItemInfo(
            code,
            item.itemName,
            item.itemQty,
            item.itemRate,
            item.itemTotal
          );
        }

        obj.set(code, agItem);
        return obj;
      }, new Map<string, AggregateItemInfo>())
      .forEach((item) => aggregateItems.push(item));
  }

  return aggregateItems;
};

export const ItemPrintDupAggregator = (items: KotTxnItemsType[]) => {
  const aggregateItems = Array<AggregateItemInfo>();

  if (items && Array.isArray(items) && items.length > 0) {
    items
      .reduce((obj, item) => {
        const code = item.item_code;
        let agItem = obj.get(code);

        if (agItem) {
          agItem = AggregateItemInfo(
            code,
            agItem.itemName,
            agItem.itemQty + item.quantity,
            agItem.itemRate,
            agItem.itemTotal + item.total
          );
        } else {
          agItem = AggregateItemInfo(
            code,
            item.item_name,
            item.quantity,
            item.rate,
            item.total
          );
        }

        obj.set(code, agItem);
        return obj;
      }, new Map<string, AggregateItemInfo>())
      .forEach((item) => aggregateItems.push(item));
  }
  return aggregateItems;
};

export const ItemReportAggregator = (items: OpenOrderItemType[]) => {
  if (items && Array.isArray(items) && items.length > 0) {
    return ItemPrintAggregator(
      items.filter((i) => !i.cancelled).map((i) => KotItemInfo(i))
    );
  }
  return Array<AggregateItemInfo>();
};
