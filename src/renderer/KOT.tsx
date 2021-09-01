/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/no-array-index-key */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';

import {
  Form,
  Col,
  Row,
  Button,
  Table as RBTable,
  InputGroup,
} from 'react-bootstrap';
import {
  AllTypeaheadOwnAndInjectedProps,
  Typeahead,
  TypeaheadMenu,
} from 'react-bootstrap-typeahead';
import AlertView from './utils/AlertView';

import {
  Item,
  KotItemInfo,
  PendingBillInfo,
  ReportInfo,
} from '../../shared/models';

import '../../assets/styles/typeahead.min.global.css';
import './Kot.global.css';

const { ipcRenderer } = window.electron;

const KOT = ({ reportInfo }: KotProps) => {
  const { push } = useHistory();
  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));
  useHotkeys('Alt+P', () => printKot());
  useHotkeys('Alt+p', () => printKot());
  useHotkeys('Alt+R', () => printReport());
  useHotkeys('Alt+r', () => printReport());

  const iTableNumber =
    useRef<
      Typeahead<{
        tableNo: number;
        inUse: boolean;
        index: number;
      }>
    >(null);
  const iCaptainName = useRef<HTMLInputElement>(null);
  const iItemCode = useRef<HTMLInputElement>(null);
  const iItemName =
    useRef<Typeahead<{ label: string; code: string; value: number }>>(null);
  const iQuantity = useRef<HTMLInputElement>(null);
  const iRate = useRef<HTMLInputElement>(null);
  const iTotal = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<string, Item>>(new Map());
  const [itemsIndexMap, setItemsIndexMap] = useState<Map<string, number>>(
    new Map()
  );
  const [curItem, setCurItem] = useState<Item | undefined>(undefined);
  const [curTableNo, setCurrentTable] = useState<number>(-1);
  const [curOrderNo, setCurrentOrderNo] = useState<number>(-1);
  const [captainName, setCaptainName] = useState<string | undefined>(undefined);

  const [nextKotNumber, setNextKotNumber] = useState<number>(-1);
  const [kotItemsMap, setKotItemsMap] = useState<Map<number, KotItemInfo[]>>(
    new Map()
  );
  const [pendingBillsMap, setPendingBillsMap] = useState<
    Map<number, PendingBillInfo>
  >(new Map());

  const [showAlertView, setShowAlertView] = useState<boolean>(false);
  const [alertParams, setAlertParams] = useState({
    isError: true,
    heading: '',
    body: '',
  });

  const fetchItems = useCallback(() => {
    ipcRenderer
      .invoke('kot_fetchItems')
      .then((kotItems: Item[]) => {
        if (kotItems.length === 0) {
          console.log('Empty Response for Fetch Items - KOT');
          setItems([]);
          setItemsMap(new Map());
          setItemsIndexMap(new Map());
        } else {
          setItems(kotItems);
          setItemsMap(
            kotItems.reduce(
              (obj, row) => obj.set(row.code, row),
              new Map<string, Item>()
            )
          );
          setItemsIndexMap(
            kotItems.reduce(
              (obj, row, index) => obj.set(row.code, index + 1),
              new Map<string, number>()
            )
          );
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  const fetchOpenOrdersInfo = useCallback(() => {
    ipcRenderer
      .invoke('kot_fetchOpenOrdersInfo')
      .then((kotItems: KotItemInfo[]) => {
        if (kotItems.length <= 0) {
          setKotItemsMap(new Map());
        } else {
          setKotItemsMap(
            kotItems.reduce((obj, row) => {
              const i = obj.get(row.tableNumber);
              if (i) {
                i.push(row);
              } else {
                const newItemsList: KotItemInfo[] = [];
                newItemsList.push(row);
                obj.set(row.tableNumber, newItemsList);
              }
              return obj;
            }, new Map<number, KotItemInfo[]>())
          );
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  const fetchPendingTablesInfo = useCallback(() => {
    ipcRenderer
      .invoke('bill_fetchPendingBillsInfo')
      .then((pendingTables: PendingBillInfo[]) => {
        if (pendingTables.length <= 0) {
          setPendingBillsMap(new Map());
        } else {
          setPendingBillsMap(
            pendingTables.reduce((obj, row) => {
              obj.set(row.tableNumber, row);
              return obj;
            }, new Map<number, PendingBillInfo>())
          );
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  const fetchNextKotNumber = useCallback(() => {
    ipcRenderer
      .invoke('kot_fetchNextKotNumber')
      .then((kotNumber: number) => setNextKotNumber(kotNumber))
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    fetchItems();
    fetchPendingTablesInfo();
    fetchNextKotNumber();
    fetchOpenOrdersInfo();
  }, [
    fetchItems,
    fetchOpenOrdersInfo,
    fetchPendingTablesInfo,
    fetchNextKotNumber,
  ]);

  useEffect(() => {
    const keyListener = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key) {
          case 'π': // Alt + p prints π on Mac
          case 'p':
          case 'P':
            printKot(false);
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', keyListener);
    return () => {
      document.removeEventListener('keydown', keyListener);
    };
  });

  useEffect(() => {
    const OpenOrdersListener = (event: any, args: any) => {
      fetchOpenOrdersInfo();
      console.log('Refetched Kot Orders');
    };

    const PendingOrdersListener = (event: any, args: any) => {
      fetchPendingTablesInfo();
      console.log('Refetched Pending Bills');
    };

    ipcRenderer.on('kot_updated', OpenOrdersListener);
    ipcRenderer.on('kot_pending_bills_updated', PendingOrdersListener);
  }, []);

  const clearItemInfo = () => {
    if (iItemCode.current) {
      iItemCode.current.value = '';
    }

    if (iItemName.current) {
      iItemName.current.setState({ selected: [], text: '' });
    }

    if (iRate.current) {
      iRate.current.value = '';
    }

    if (iQuantity.current) {
      iQuantity.current.value = '';
    }

    if (iTotal.current) {
      iTotal.current.value = '';
    }

    setCurItem(undefined);
  };

  const showErrorAlert = (message: string) => {
    setAlertParams({
      body: message,
      heading: 'Error',
      isError: true,
    });

    setShowAlertView(true);
  };

  const loadItem = () => {
    if (iItemCode.current?.value && itemsMap.has(iItemCode.current.value)) {
      const item = itemsMap.get(iItemCode.current.value);
      if (iItemName.current && iRate.current) {
        iItemName.current.setState((t) => ({
          ...t,
          selected: [
            {
              label: item?.name,
              code: item?.code,
              value: itemsIndexMap.get(item?.code || '') || 0,
            },
          ],
        }));
        setCurItem(item);
        iRate.current.value = item?.rate.toString() || '';
      } else {
        clearItemInfo();
        showErrorAlert('Something went wrong');
      }
    } else {
      clearItemInfo();
      showErrorAlert('Invalid item code');
    }
  };

  const clearForm = () => {
    clearItemInfo();
    if (iTableNumber.current) {
      iTableNumber.current.setState({ selected: [], text: '' });
    }

    setCurrentOrderNo(-1);
    setCurrentTable(-1);
    setCaptainName(undefined);
  };

  const itemCodeOnKeyDownHandler = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (
      iItemCode.current &&
      iItemCode.current.value.trim().length > 0 &&
      event.key.toLowerCase().trim() === 'enter'
    ) {
      event.preventDefault();
      event.stopPropagation();
      loadItem();
      iQuantity.current?.focus();
    }
  };

  const handleItemSelect = (
    selected: { label: string; code: string; value: number }[]
  ) => {
    const index = (selected[0]?.value || 0) - 1;

    if (index < 0 || index >= items.length) {
      clearItemInfo();
    } else if (iItemCode.current) {
      // console.log("Item Index: ", index);
      const item = items[index];
      iItemCode.current.value = item?.code || '';
      setCurItem(item);
      if (iRate.current) {
        iRate.current.value = item?.rate.toString() || '';
      }
      iQuantity.current?.focus();
    } else {
      clearForm();
    }
  };

  const filterBy = (
    option: { label: string; code: string; value: number },
    state: AllTypeaheadOwnAndInjectedProps<{
      label: string;
      code: string;
      value: number;
    }>
  ) => {
    if (state.selected?.length) {
      return true;
    }
    return option.label.toLowerCase().indexOf(state.text.toLowerCase()) > -1;
  };

  const handleItemQuantityChagne = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Number.parseInt(e.target.value, 10) <= 0) {
      e.target.value = '0';
      if (iTotal.current) iTotal.current.value = '0';
    } else {
      const rate = Number.parseInt(iRate.current?.value || '', 10) || 0;
      const qty = Number.parseInt(iQuantity.current?.value || '', 10) || 0;
      if (iTotal.current) iTotal.current.value = (rate * qty).toString();
      else clearForm();
    }
  };

  const addKotItem = () => {
    const selectedQty = iQuantity.current?.value || 1;

    console.log(curTableNo);
    if (curTableNo > 0 && curItem && selectedQty > 0) {
      const openItems = kotItemsMap.get(curTableNo);
      if (openItems && openItems.length > 0) {
        const { orderId } = openItems[0];
        ipcRenderer
          .invoke('kot_addItemToExistingOrder', {
            item: curItem,
            qty: selectedQty,
            orderId,
          })
          .then((_res: unknown) => {
            console.log('Item Added To Existing Order');
            clearItemInfo();
            fetchOpenOrdersInfo();
            return '';
          })
          .catch((err: unknown) => {
            console.log(err);
          });
      } else {
        ipcRenderer
          .invoke('kot_addItemToNewOrder', {
            item: curItem,
            kotNo: nextKotNumber,
            tableNo: curTableNo,
            qty: selectedQty,
            captainName,
            reportId: reportInfo.curReportId,
            reportDate: reportInfo.curReportDateStr,
          })
          .then((_res: unknown) => {
            console.log('New Item Order Added');
            clearItemInfo();
            fetchNextKotNumber();
            fetchOpenOrdersInfo();
            return '';
          })
          .catch((err: unknown) => {
            console.log(err);
          });
      }
    } else if (curTableNo === -1) {
      showErrorAlert('Select a table number');
    } else if (curItem === undefined) {
      showErrorAlert('Select an item to be added');
    } else {
      showErrorAlert('Quantity must be at-least 1');
    }
  };

  const qtyKeyPressHandler = (
    event: React.KeyboardEvent<HTMLDivElement>
  ): void => {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      addKotItem();
      iItemCode.current?.focus();
    }
  };

  const handleTableSelect = (
    selected: { tableNo: number; inUse: boolean; index: number }[]
  ) => {
    if (selected && selected.length > 0) {
      const ti = selected[0];
      setCurrentTable(ti.tableNo);

      const kotItemsForTable = kotItemsMap.get(ti.tableNo);
      if (pendingBillsMap.has(ti.tableNo)) {
        showErrorAlert(`Table No ${curTableNo} already has a pending bill`);
        clearForm();
      } else if (kotItemsForTable && kotItemsForTable.length > 0) {
        setCurrentOrderNo(kotItemsForTable[0].orderId);
        setCaptainName(kotItemsForTable[0].captainName);
        setTimeout(() => iItemCode.current?.focus(), 5);
      } else {
        setCurrentOrderNo(-1);
        iCaptainName.current?.focus();
      }
    } else if (selected.length === 0) {
      clearForm();
    }
  };

  const tableNumberKeyDownHandler = (event: any) => {
    if (event.key.toLowerCase().trim() === 'enter') {
      if (pendingBillsMap.has(curTableNo)) {
        setCurrentTable(-1);
        showErrorAlert('Table already has a pending bill');
      } else if (curOrderNo > 0) {
        iItemCode.current?.focus();
      } else {
        iCaptainName.current?.focus();
      }
    }
  };

  const captainNameOnKeyDownHandler = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key.toLowerCase().trim() === 'enter') {
      if (captainName && captainName.trim().length > 0) {
        iItemCode.current?.focus();
      }
    }
  };

  const handleTableInput = (input: string, _e: Event) => {
    try {
      const tNo = Number.parseInt(input, 10);

      setCurrentTable(tNo);
      setCaptainName(undefined);
      setCurrentOrderNo(-1);

      if (kotItemsMap && kotItemsMap.has(tNo)) {
        const kotItemsForTable = kotItemsMap.get(tNo);
        if (kotItemsForTable && kotItemsForTable.length > 0) {
          setCurrentOrderNo(kotItemsForTable[0].orderId);
          setCaptainName(kotItemsForTable[0].captainName);
        }
      }
    } catch (e) {
      // console.log("Error");
      showErrorAlert('Table No must be a valid number');
      clearForm();
      setCurrentTable(-1);
    }
  };

  const getOrdersForTable = () => {
    if (kotItemsMap.get(curTableNo)) {
      const kotItems = (kotItemsMap.get(curTableNo) || []).filter(
        (i) => i.voided || !i.cancelled
      );
      return kotItems.map((info, index) => {
        const cssClassName = info.voided ? 'KotCancelledRow' : 'KotRow';
        return (
          <tr key={index} className={cssClassName}>
            <td key={index}>
              <div>
                {index + 1}{' '}
                {info.printed ? <FontAwesomeIcon icon={faCheck} /> : ''}
              </div>
            </td>
            <td key={`${index}_Code`}>{info.itemCode}</td>
            <td key={`${index}_Name`}>{info.itemName}</td>
            <td key={`${index}_Qty`}>{info.itemQty}</td>
            <td key={`${index}_Rate`}>{info.itemRate}</td>
            <td key={`${index}_Total`}>{info.itemTotal}</td>
            {info.voided ? (
              <td />
            ) : (
              <td
                key={`${index}_CancelBtn`}
                className="TrashContainer"
                onClick={() => cancelItem(info.itemId, info.orderId)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </td>
            )}
          </tr>
        );
      });
    }
    return [];
  };

  const cancelItem = (itemId: number, orderId: number) => {
    ipcRenderer
      .invoke('kot_cancelItem', {
        itemId,
        orderId,
      })
      .then((_res: unknown) => {
        console.log('Item Cancelled');
        fetchOpenOrdersInfo();
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  };

  const printKot = (printVoided = false) => {
    const pItems = kotItemsMap.get(curTableNo);
    if (pItems && pItems.length > 0) {
      let printableItems: KotItemInfo[] = [];
      if (printVoided) {
        printableItems = pItems.filter((i) => i.cancelled && !i.printed);
      } else {
        printableItems = pItems.filter((i) => !(i.cancelled || i.printed));
      }

      if (printableItems.length > 0) {
        ipcRenderer
          .invoke('kot_printed', {
            captainName,
            items: printableItems,
            tableNumber: curTableNo,
            isVoidKot: printVoided,
          })
          .then((_res: any) => {
            // console.log(res);
            fetchOpenOrdersInfo();
            return '';
          })
          .catch((err: unknown) => {
            console.log(err);
          });
      } else {
        console.log('Nothing to be printed');
      }
    } else {
      console.log('Add items before printing');
    }
  };

  const printReport = () => {
    if (curOrderNo > 0 && curTableNo > 0) {
      ipcRenderer
        .invoke('kot_printReport', {
          orderNo: curOrderNo,
          tableNumber: curTableNo,
        })
        .then((res: any) => {
          console.log(res);
          return '';
        })
        .catch((err: unknown) => {
          console.log(err);
        });
    } else {
      console.log('Invalid TableNo or OrderNo');
    }
  };

  return (
    <div className="Container">
      <div className="KotInfo">
        <AlertView
          show={showAlertView}
          setShow={setShowAlertView}
          isError={alertParams.isError}
          body={alertParams.body}
          heading={alertParams.heading}
        />
        <Form>
          <Form.Row className="KotFormRow">
            <Form.Group as={Col} sm={1} />

            <InputGroup className="mb-3" as={Col} sm={5}>
              <InputGroup.Prepend>
                <InputGroup.Text id="table-no">Table No</InputGroup.Text>
              </InputGroup.Prepend>
              <Typeahead
                multiple={false}
                id="table-number"
                highlightOnlyResult
                labelKey={(o) => o.tableNo.toString()}
                renderMenu={(results, _, props) => {
                  // Hide the menu when there are no results.
                  if (!results.length) {
                    return null;
                  }
                  return (
                    <TypeaheadMenu
                      labelKey={(o) => o.tableNo.toString()}
                      options={results}
                      id="filtered-menu"
                      // eslint-disable-next-line react/prop-types
                      text={props.text}
                    />
                  );
                }}
                options={Array.from(kotItemsMap.keys()).map((tableNo, ind) => ({
                  tableNo,
                  inUse: false,
                  index: ind,
                }))}
                ref={iTableNumber}
                placeholder=""
                onBlur={(_) => iTableNumber.current?.hideMenu()}
                onInputChange={handleTableInput}
                onChange={handleTableSelect}
                onKeyDown={tableNumberKeyDownHandler}
              />
            </InputGroup>

            <InputGroup className="mb-3" as={Col} sm={5}>
              <InputGroup.Prepend>
                <InputGroup.Text id="captain-name">
                  Captain Name:{' '}
                </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="text"
                ref={iCaptainName}
                value={captainName || ''}
                disabled={curOrderNo > 0}
                placeholder=""
                onKeyDown={captainNameOnKeyDownHandler}
                onChange={(e) => setCaptainName(e.target.value || undefined)}
              />
            </InputGroup>

            <Form.Group as={Col} sm={1} />
          </Form.Row>

          <Form.Row className="KotFormRow">
            <Form.Group as={Col} sm={1} />

            <InputGroup className="mb-3" as={Col} sm={5}>
              <InputGroup.Prepend>
                <InputGroup.Text id="item-code">Item Code</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="number"
                ref={iItemCode}
                onKeyDown={itemCodeOnKeyDownHandler}
                disabled={curTableNo <= 0}
              />
            </InputGroup>

            <InputGroup className="mb-3" as={Col} sm={5}>
              <InputGroup.Prepend>
                <InputGroup.Text id="item-qty">Qty</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="number"
                ref={iQuantity}
                placeholder=""
                onChange={handleItemQuantityChagne}
                onKeyPress={qtyKeyPressHandler}
              />
            </InputGroup>

            <Form.Group as={Col} sm={1} />
          </Form.Row>

          <Form.Row className="KotFormRow">
            <Form.Group as={Col} sm={1} />

            <InputGroup className="mb-3" as={Col} sm={5}>
              <InputGroup.Prepend>
                <InputGroup.Text id="item-name">Item Name</InputGroup.Text>
              </InputGroup.Prepend>
              <Typeahead
                multiple={false}
                filterBy={filterBy}
                id="item-name"
                options={[{ code: '', name: '' }, ...items].map((i, ind) => ({
                  label: i.name,
                  code: i.code,
                  value: ind,
                }))}
                ref={iItemName}
                placeholder=""
                onChange={handleItemSelect}
                disabled={curTableNo <= 0}
              />
            </InputGroup>

            <Form.Group as={Col} sm={2}>
              <Form.Control ref={iRate} readOnly placeholder="Rate" />
            </Form.Group>

            <Form.Group as={Col} sm={3}>
              <Form.Control
                type="number"
                readOnly
                ref={iTotal}
                placeholder="Total"
              />
            </Form.Group>

            <Form.Group as={Col} sm={1} />
          </Form.Row>

          <Form.Group as={Row} className="KotFormButtonsGroup">
            <Form.Label column sm={1} />
            <Col sm={2}>
              <Button
                className="KotFormButton"
                variant="flat"
                onClick={addKotItem}
                block
              >
                Save
              </Button>
            </Col>
            <Col sm={2}>
              <Button
                className="KotFormButton"
                variant="info"
                onClick={() => printKot(false)}
                block
              >
                Print KOT
              </Button>
            </Col>
            <Col sm={2}>
              <Button
                className="KotFormButton"
                variant="info"
                onClick={() => printKot(true)}
                block
              >
                Print Void KOT
              </Button>
            </Col>
            <Col sm={2}>
              <Button
                className="KotFormButton"
                variant="info"
                onClick={() => printReport()}
                block
              >
                Report
              </Button>
            </Col>
            <Col sm={2}>
              <Button
                className="KotFormButton"
                variant="flat"
                onClick={() => {
                  push('/billing');
                }}
                block
              >
                Make Bill
              </Button>
            </Col>
            <Form.Label column sm={1} />
          </Form.Group>
        </Form>
      </div>
      <div className="Table">
        <RBTable striped bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>{getOrdersForTable()}</tbody>
        </RBTable>
      </div>
    </div>
  );
};

type KotProps = {
  reportInfo: ReportInfo;
};

export default KOT;
