/* eslint-disable react/no-array-index-key */
import React, { useEffect, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  Form,
  Row,
  Col,
  Table as RBTable,
  InputGroup,
  Button,
} from 'react-bootstrap';
import AlertView from './utils/AlertView';
import ConfirmModal from './utils/Modal';

import './Billing.global.css';
import { KotItemInfo, BillAmountInfo } from '../../shared/models';

const { ipcRenderer } = window.electron;

const Billing: React.FC = () => {
  const { push } = useHistory();

  const [kotItemsMap, setKotItemsMap] = useState<Map<number, KotItemInfo[]>>(
    new Map()
  );
  const [curOrderId, setCurOrderId] = useState<number>(-1);
  const [curTableNo, setCurTableNo] = useState<number>(-1);
  const [curItems, setCurItems] = useState<KotItemInfo[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const [billNo, setBillNo] = useState<number>(-1);
  const [curBillAmountInfo, setBillAmountInfo] =
    useState<BillAmountInfo | undefined>(undefined);
  const [modalShow, setModalShow] = React.useState(false);

  const [showAlertView, setShowAlertView] = useState<boolean>(false);
  const [alertParams, setAlertParams] = useState({
    isError: true,
    heading: '',
    body: '',
  });

  const showErrorAlert = (message: string) => {
    setAlertParams({
      body: message,
      heading: 'Error',
      isError: true,
    });

    setShowAlertView(true);
  };

  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));
  useHotkeys('Alt + Enter', () => {
    if (curBillAmountInfo?.grandTotal) {
      setModalShow(true);
    } else {
      showErrorAlert('Add a valid bill');
    }
  });

  const clearForm = () => {
    setCurTableNo(-1);
    setCurOrderId(-1);
    setCurItems([]);
    setBillAmountInfo(undefined);
    setDiscountPercent(0);
  };

  const fetchBillCounter = useCallback(() => {
    ipcRenderer
      .invoke('bill_fetchCounter')
      .then((counter: number) => {
        if (counter > 0) {
          setBillNo(counter);
        } else {
          showErrorAlert('Something went wrong! Try again.');
          setBillNo(-1);
          clearForm();
        }
        return '';
      })
      .catch((err: any) => {
        console.log(err);
      });
  }, []);

  const fetchOpenOrdersInfo = useCallback(() => {
    ipcRenderer
      .invoke('kot_fetchOpenOrdersInfo')
      .then((kotItems: KotItemInfo[]) => {
        if (kotItems.length <= 0) {
          console.log('No Orders Found');
          setKotItemsMap(new Map());
        } else {
          setKotItemsMap(
            kotItems.reduce((obj, row) => {
              const items = obj.get(row.tableNumber);
              if (items) {
                items.push(row);
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

  const handleTableSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value && e.target.value !== '') {
      const tableNumber = Number.parseInt(e.target.value, 10);
      if (
        kotItemsMap.has(tableNumber) &&
        kotItemsMap.get(tableNumber)?.length
      ) {
        const kotItems: KotItemInfo[] = kotItemsMap.get(tableNumber) || [];
        setCurTableNo(tableNumber);
        setCurItems(kotItems.filter((i) => !i.cancelled));
        setCurOrderId(kotItems[0].orderId);
      } else {
        console.error('No pending items for selected table');
      }
    } else {
      clearForm();
      console.error('Invalid Table No');
    }
  };

  const getOrdersForTable = () => {
    if (curItems.length > 0) {
      return curItems.map((info, index) => {
        return (
          <tr key={index} className="KotRow">
            <td key={index}>{index + 1}</td>
            <td key={`${index}_Code`}>{info.itemCode}</td>
            <td key={`${index}_Name`}>{info.itemName}</td>
            <td key={`${index}_Qty`}>{info.itemQty}</td>
            <td key={`${index}_Rate`}>{info.itemRate}</td>
            <td key={`${index}_Total`}>{info.itemTotal}</td>
          </tr>
        );
      });
    }
    return [];
  };

  const createBill = useCallback(
    (printBill: boolean) => {
      if (curItems.length > 0 && billNo > 0 && curBillAmountInfo) {
        console.log('Generating Bill');
        ipcRenderer
          .invoke('bill_generate', {
            printBill,
            billNo,
            orderId: curOrderId,
            tableNo: curTableNo,
            items: curItems,
            billAmountInfo: curBillAmountInfo,
          })
          .then((err: { msg: string } | undefined) => {
            if (err) {
              console.log('Failed to generate bill', err);
            } else {
              console.log('Bill Generated! Clearning Form');
              clearForm();
              fetchOpenOrdersInfo();
              setBillNo(billNo + 1);
            }

            return '';
          })
          .catch((err: unknown) => {
            console.log(err);
          });
      } else if (billNo > 0) {
        console.log('No items to be billed');
      } else {
        showErrorAlert('Unknown Error occurred. Invalid Bill Number!');
      }
    },
    [
      fetchOpenOrdersInfo,
      curOrderId,
      billNo,
      curBillAmountInfo,
      curTableNo,
      curItems,
    ]
  );

  useEffect(() => {
    fetchOpenOrdersInfo();
    fetchBillCounter();
  }, [fetchOpenOrdersInfo, fetchBillCounter]);

  const roundingFunction = (someNumber: number, limit = 2) =>
    // eslint-disable-next-line no-restricted-properties
    Math.round(someNumber * Math.pow(10, limit)) / Math.pow(10, limit);

  useEffect(() => {
    if (curItems.length > 0) {
      const categoryWiseMap = curItems.reduce((obj, item) => {
        let categoryInfo = Array<number>();
        const category = item.itemGstCategory;
        if (obj.has(category) && obj.get(category)) {
          categoryInfo = obj.get(category) || Array<number>();
        }

        categoryInfo[0] = item.itemTotal + (categoryInfo[0] || 0);
        categoryInfo[1] = item.itemGstPercent;

        obj.set(category, categoryInfo);
        return obj;
      }, new Map<string, Array<number>>());

      let total = 0;
      let preDiscountFoodTotal = 0;
      let taxOnFood = 0;
      let discountAmount = 0;
      let totalAfterDiscount = 0;
      let taxableAmount = 0;
      let liquorAmount = 0;
      let beerAmount = 0;
      let nonTaxableAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;

      Array.from(categoryWiseMap.keys()).forEach((key) => {
        const categoryInfo = categoryWiseMap.get(key);
        if (categoryInfo && categoryInfo.length === 2) {
          total += categoryInfo[0];
          taxOnFood += categoryInfo[0] * (categoryInfo[1] / 100);

          const cDiscountAmount = categoryInfo[0] * (discountPercent / 100);
          const cAfterDiscount = categoryInfo[0] - cDiscountAmount;
          discountAmount += cDiscountAmount;
          totalAfterDiscount += cAfterDiscount;

          if (categoryInfo[1] > 0) {
            preDiscountFoodTotal += categoryInfo[0];
            taxableAmount += cAfterDiscount;
            cgstAmount += cAfterDiscount * (categoryInfo[1] / 200);
            sgstAmount += cAfterDiscount * (categoryInfo[1] / 200);
          } else if (key === 'Liquor') {
            liquorAmount += categoryInfo[0];
            nonTaxableAmount += cAfterDiscount;
          } else if (key === 'Beer') {
            beerAmount += categoryInfo[0];
            nonTaxableAmount += cAfterDiscount;
          } else {
            nonTaxableAmount += cAfterDiscount;
          }
        } else {
          showErrorAlert('Error occurred while calculating GST!');
        }
      });

      const totalTaxAmount = cgstAmount + sgstAmount;
      const grandTotal = Math.ceil(totalTaxAmount + totalAfterDiscount);

      setBillAmountInfo({
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
    } else {
      setBillAmountInfo(undefined);
    }
  }, [discountPercent, curItems]);

  return (
    <div className="BillingContainer">
      <AlertView
        show={showAlertView}
        setShow={setShowAlertView}
        isError={alertParams.isError}
        body={alertParams.body}
        heading={alertParams.heading}
      />
      <ConfirmModal
        show={modalShow}
        headerText="Generate Bill"
        bodyText="Do you want to print the bill?"
        positiveCallback={(_e: unknown) => {
          console.log('Printing Bill');
          setModalShow(false);
          createBill(true);
        }}
        negativeCallback={() => {
          setModalShow(false);
          createBill(false);
        }}
        closeCallback={() => {
          setModalShow(false);
        }}
      />
      <div className="LeftPane">
        <div className="BillingInfo">
          <Form>
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={2} />

              <InputGroup className="mb-3" as={Col} sm={3}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="table-no">Table No</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  as="select"
                  placeholder=""
                  onChange={handleTableSelect}
                  value={curTableNo > 0 ? curTableNo : ''}
                  disabled={kotItemsMap.size === 0}
                >
                  {['', ...Array.from(kotItemsMap.keys())].map((tableNo, _) => (
                    <option key={tableNo} value={tableNo}>
                      {tableNo}
                    </option>
                  ))}
                </Form.Control>
              </InputGroup>

              <Form.Group as={Col} sm={2} />

              <InputGroup className="mb-3" as={Col} sm={3}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="order-no">Order No</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder=""
                  disabled
                  value={curOrderId > 0 ? curOrderId : ''}
                />
              </InputGroup>

              <Form.Group as={Col} sm={2} />
            </Form.Row>
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
              </tr>
            </thead>
            <tbody>{getOrdersForTable()}</tbody>
          </RBTable>
        </div>
        <div className="BillingFooter">
          <Form>
            <Form.Row className="FormRow NoMargin">
              <Form.Label column sm={2} />
              <Form.Label column sm={2}>
                {' '}
                Amount{' '}
              </Form.Label>
              <Form.Label column sm={2}>
                {' '}
                GST @ 5%{' '}
              </Form.Label>
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
            </Form.Row>
            <Form.Row className="FormRow NoMargin">
              <Form.Label column sm={2}>
                {' '}
                Food{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    Math.max(
                      (curBillAmountInfo?.total || 0) -
                        (curBillAmountInfo?.beerAmount || 0) -
                        (curBillAmountInfo?.liquorAmount || 0),
                      0
                    ),
                    3
                  )}
                  disabled
                />
              </Form.Group>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={curBillAmountInfo?.taxOnFood.toFixed(3) || ''}
                  disabled
                />
              </Form.Group>
              <Form.Label column sm={1} />

              <InputGroup className="mb-3" as={Col} sm={3}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="Discount">Discount</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="number"
                  value={discountPercent}
                  onChange={(e) => {
                    try {
                      let dp = Number.parseInt(e.target.value, 10);
                      dp = Math.max(Math.min(dp, 100), 0);
                      setDiscountPercent(dp);
                      // eslint-disable-next-line @typescript-eslint/no-shadow
                    } catch (e) {
                      console.log(e);
                      setDiscountPercent(0);
                    }
                  }}
                />
              </InputGroup>

              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    curBillAmountInfo?.discountAmount || 0,
                    3
                  )}
                  disabled
                />
              </Form.Group>
            </Form.Row>
            <Form.Row className="FormRow NoMargin">
              <Form.Label column sm={2}>
                {' '}
                Beer{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    curBillAmountInfo?.beerAmount || 0,
                    3
                  )}
                  disabled
                />
              </Form.Group>
              <Form.Label as={Col} sm={2} />
              <Form.Label column sm={1} />
              <Form.Label column sm={3} style={{ textAlign: 'left' }}>
                {' '}
                Taxable Total{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    curBillAmountInfo?.taxableAmount || 0,
                    3
                  )}
                  disabled
                />
              </Form.Group>
            </Form.Row>
            <Form.Row className="FormRow NoMargin">
              <Form.Label as={Col} sm={2}>
                {' '}
                Liquor{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    curBillAmountInfo?.liquorAmount || 0,
                    3
                  )}
                  disabled
                />
              </Form.Group>
              <Form.Label as={Col} sm={2} />
              <Form.Label column sm={1} />

              <Form.Label column sm={3} style={{ textAlign: 'left' }}>
                {' '}
                Non Taxable Amount{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={
                    roundingFunction(
                      curBillAmountInfo?.nonTaxableAmount || 0,
                      3
                    ) || ''
                  }
                  disabled
                />
              </Form.Group>
            </Form.Row>
            <Form.Row className="FormRow NoMargin">
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
              <Form.Label column sm={1} />
              <Form.Label column sm={3} style={{ textAlign: 'left' }}>
                {' '}
                Total Tax{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={curBillAmountInfo?.totalTaxAmount.toFixed(3) || ''}
                  disabled
                />
              </Form.Group>
            </Form.Row>
            <Form.Row className="FormRow NoMargin">
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
              <Form.Label column sm={2} />
              <Form.Label column sm={1} />
              <Form.Label column sm={3} style={{ textAlign: 'left' }}>
                {' '}
                Grand Total{' '}
              </Form.Label>
              <Form.Group as={Col} sm={2}>
                <Form.Control
                  type="number"
                  value={roundingFunction(
                    curBillAmountInfo?.grandTotal || 0,
                    3
                  )}
                  disabled
                />
              </Form.Group>
            </Form.Row>
          </Form>
        </div>
      </div>
      <div className="RightPane">
        <div className="RightPaneTop">
          <p className="BillPayHeading">Payment Details</p>
          <Form>
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={3} />

              <InputGroup className="mb-3" as={Col} sm={6}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="bill-no">Bill No</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder=""
                  value={curTableNo > 0 ? billNo : ''}
                  disabled
                />
              </InputGroup>

              <Form.Group as={Col} sm={3} />
            </Form.Row>
          </Form>
        </div>
        <div className="RightPaneTop">
          <Form.Group as={Row} className="FormButtons">
            <Form.Label column sm={1} />
            <Col sm={4}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (curBillAmountInfo?.grandTotal) {
                    setModalShow(true);
                  } else {
                    showErrorAlert('Add a valid bill');
                  }
                }}
                block
              >
                Save
              </Button>
            </Col>
            <Form.Label column sm={1} />
            <Col sm={4}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => push('/pendingBills')}
                block
              >
                Pending Bill
              </Button>
            </Col>
            <Form.Label column sm={1} />
          </Form.Group>
          <Form.Group as={Row} className="FormButtons">
            <Form.Label column sm={4} />
            <Col sm={4}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => clearForm()}
                block
              >
                Reset
              </Button>
            </Col>
            <Form.Label column sm={4} />
          </Form.Group>
        </div>
      </div>
    </div>
  );
};

export default Billing;
