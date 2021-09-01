/* eslint-disable react/no-array-index-key */
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { Form, Col, Row, Button, Table as RBTable } from 'react-bootstrap';

import AlertView from '../../utils/AlertView';
import {
  ConsolidatedReportItem,
  KotItemInfo,
  PendingBillInfo,
} from '../../../shared';

import './CashierReport.global.css';

const { ipcRenderer, store } = window.electron;

interface LocationState {
  reportId: number;
  reportDateStr: string;
  today: boolean;
}

// ipcRenderer.on("emailed-cashier-pdf", (event: any) => {
//   const message = `Emailed Cashier PDF`;
//   alert(message);
// });

const CashierReport: React.FC = () => {
  const { push } = useHistory();
  const location = useLocation<LocationState>();

  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const [cashierReportMap, setCashierReportMap] = useState<Map<string, number>>(
    new Map()
  );

  const [pendingReportOrders, setPendingReportOrders] = useState<
    Array<number[]>
  >(new Array<number[]>());
  const [totalPendingValue, setTotalPendingValue] = useState<number>(0);

  const [openClosedItems, setOpenClosedItems] = useState<
    Array<{
      kotNo: number;
      itemName: string;
      itemRate: number;
      itemQty: number;
      itemTotal: number;
    }>
  >([]);
  const [totalOpenKotValue, setTotalOpenKotValue] = useState<number>(0);

  const [totalSum, setTotalSum] = useState<number>(0);
  const [totalDisc, setTotalDisc] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);

  const roundingFunction = (someNumber: number, limit = 2) =>
    // eslint-disable-next-line no-restricted-properties
    Math.round(someNumber * Math.pow(10, limit)) / Math.pow(10, limit);

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

  const fetchCashierInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .invoke('report_consolidated_report', { reportId })
        .then((res: ConsolidatedReportItem[]) => {
          setCashierReportMap(
            res.reduce((obj, row) => {
              const curTotal = obj.get(row.paymentType) || 0;
              const newTotal = curTotal + row.grandTotal;

              obj.set(row.paymentType, newTotal);
              setTotalSum((t) => t + row.grandTotal);
              setTotalDisc((t) => t + row.discountAmount);
              setTotalTax((t) => t + row.totalTaxAmount);

              return obj;
            }, new Map<string, number>())
          );
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      alert('Invalid Report ID');
    }
  }, [location]);

  const fetchClosedPendingInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .sendSync('report_closed_pending_report', {
          reportId,
        })
        .then((res: PendingBillInfo[]) => {
          setPendingReportOrders(
            res.reduce((arr, item) => {
              const orderInfo = [item.orderId, item.billTotal];
              arr.push(orderInfo);

              setTotalPendingValue((t) => t + item.billTotal);

              return arr;
            }, new Array<number[]>())
          );
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    }
  }, [location]);

  const fetchClosedOpenInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .invoke('report_closed_open_report', {
          reportId,
        })
        .then((res: KotItemInfo[]) => {
          console.log('Open Closed: ', res);
          // Item Name, Kot No, Item Qty, Item Rate, Item Total
          setOpenClosedItems(
            res.reduce((arr, item) => {
              const itemInfo = {
                kotNo: item.orderKotNo,
                itemName: item.itemName,
                itemRate: item.itemRate,
                itemQty: item.itemQty,
                itemTotal: item.itemTotal,
              };
              arr.push(itemInfo);

              setTotalOpenKotValue((t) => t + item.itemTotal);

              return arr;
            }, new Array<{ kotNo: number; itemName: string; itemRate: number; itemQty: number; itemTotal: number }>())
          );
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    }
  }, [location]);

  useEffect(() => {
    fetchCashierInfo();
    fetchClosedPendingInfo();
    fetchClosedOpenInfo();
  }, [fetchCashierInfo, fetchClosedPendingInfo, fetchClosedOpenInfo]);

  const getCashierTotals = () => {
    if (cashierReportMap.size > 0) {
      return (
        <tr>
          <td key="Name">Admin</td>
          <td key="Cash">{cashierReportMap.get('Cash') || 0}</td>
          <td key="Credit">{cashierReportMap.get('Credit') || 0}</td>
          <td key="C.C">{cashierReportMap.get('C.C') || 0}</td>
          <td key="RoomAccount">{cashierReportMap.get('RoomAccount') || 0}</td>
          <td key="PhonePe">{cashierReportMap.get('PhonePe') || 0}</td>
          <td key="Swiggy">{cashierReportMap.get('Swiggy') || 0}</td>
          <td key="Zomato">{cashierReportMap.get('Zomato') || 0}</td>
          <td key="Discount">{totalDisc || 0}</td>
          <td key="GST">{roundingFunction(totalTax || 0)}</td>
          <td key="Total">{totalSum || 0}</td>
        </tr>
      );
    }
    return [];
  };

  const getPendingTotals = () => {
    if (pendingReportOrders.length > 0) {
      return pendingReportOrders.map((order) => (
        <tr key={order[0]}>
          <td key="OrderNo">{order[0]}</td>
          <td key="Amount">{order[1] || 0}</td>
        </tr>
      ));
    }
    return [];
  };

  const getOpenTotals = () => {
    if (openClosedItems.length > 0) {
      return openClosedItems.map((item, ind) => (
        <tr key={ind}>
          <td key="Kot No">{item.kotNo}</td>
          <td key="Name">{item.itemName}</td>
          <td key="Rate">{item.itemRate}</td>
          <td key="Qty">{item.itemQty}</td>
          <td key="Total">{item.itemTotal}</td>
        </tr>
      ));
    }
    return [];
  };

  const generatePdf = () => {
    if (cashierReportMap.size > 0) {
      ipcRenderer.send('report_to_pdf', { fileName: 'cashier-report' });
    } else {
      showErrorAlert('No data available for Cashier Report');
    }
  };

  const emailCashierReport = () => {
    if (cashierReportMap.size > 0) {
      ipcRenderer.send('email_pdf_report', {
        fileName: `Cashier Report - ${location?.state?.reportDateStr}`,
        type: 'cashier',
      });
    } else {
      showErrorAlert('No data available for Cashier Report');
    }
  };

  return (
    <div>
      <AlertView
        show={showAlertView}
        setShow={setShowAlertView}
        isError={alertParams.isError}
        body={alertParams.body}
        heading={alertParams.heading}
      />
      <FontAwesomeIcon
        style={{ display: 'flex', marginLeft: '24px', marginTop: '24px' }}
        icon={faArrowLeft}
        onClick={() => push('/reports')}
      />
      <div className="ReportContainer">
        <div>
          <Form>
            <Form.Group as={Row} className="FormButtons">
              <Form.Label column sm={2} />
              <Col sm={4}>
                <Button
                  variant="secondary"
                  onClick={generatePdf}
                  block
                  disabled={location.state?.today}
                >
                  Download
                </Button>
              </Col>
              <Col sm={4}>
                <Button
                  variant="primary"
                  block
                  onClick={emailCashierReport}
                  disabled={location.state?.today}
                >
                  Email
                </Button>
              </Col>
              <Form.Label column sm={2} />
            </Form.Group>
          </Form>
        </div>
        <div>
          <p className="ScreenHeader">
            {' '}
            Cashier Report of Hotel Bala Regency (Dated:{' '}
            {location?.state?.reportDateStr || 'N/A'} ){' '}
          </p>
          <p className="CashierPrintHeader" id="print-header">
            {' '}
            Cashier Report of Hotel Bala Regency (
            {(store.get('ClientName') as string) || ''}
            ) <br /> {location?.state?.reportDateStr || 'N/A'}{' '}
          </p>
          <div id="printer-content">
            <div className="CashierReport">
              <RBTable striped bordered>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Cash</th>
                    <th>Credit</th>
                    <th>C. C.</th>
                    <th>RoomAccount</th>
                    <th>PhonePe</th>
                    <th>Swiggy</th>
                    <th>Zomato</th>
                    <th>Disc</th>
                    <th>GST</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>{getCashierTotals()}</tbody>
              </RBTable>
            </div>
            <div className="PendingReport">
              <p>Pending Orders</p>
              <RBTable striped bordered>
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>{getPendingTotals()}</tbody>
              </RBTable>
              <p>Total Pending Amount = {totalPendingValue}</p>
            </div>
            <div className="OpenClosedReport">
              <p>Open KOT Orders</p>
              <RBTable striped bordered>
                <thead>
                  <tr>
                    <th>Kot No</th>
                    <th>Item Name</th>
                    <th>Item Rate</th>
                    <th>Item Qty</th>
                    <th>Item Total</th>
                  </tr>
                </thead>
                <tbody>{getOpenTotals()}</tbody>
              </RBTable>
              <p>Total KOT Amount = {totalOpenKotValue}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierReport;
