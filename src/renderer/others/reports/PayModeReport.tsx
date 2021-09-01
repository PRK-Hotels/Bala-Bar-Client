import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { Form, Col, Row, Button, Table as RBTable } from 'react-bootstrap';

import AlertView from '../../utils/AlertView';
import { ConsolidatedReportItem } from '../../../shared';
import PayModeTypes from '../../utils/PayModeTypes';

import './PayModeReport.global.css';

const { ipcRenderer, store } = window.electron;

interface LocationState {
  reportId: number;
  reportDateStr: string;
  today: boolean;
}

// ipcRenderer.on("emailed-paymode-pdf", (event: any) => {
//   const message = `Emailed PayMode PDF`;
//   alert(message);
// });

const PayModeReport: React.FC = () => {
  const { push } = useHistory();
  const location = useLocation<LocationState>();

  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const initialState = {
    payModeBillNo: new Map<string, string>(),
    payInfoBillNo: new Map<string, ConsolidatedReportItem>(),
    payModeReport: new Map<string, ConsolidatedReportItem[]>(),
    payModeTotal: new Map<string, number[]>(),
    sumFoodTotal: Number(0),
    sumLiquorTotal: Number(0),
    sumBeerTotal: Number(0),
    sumGrandTotal: Number(0),
    sumBillTotal: Number(0),
    sumCgstTotal: Number(0),
    sumSgstTotal: Number(0),
    sumTotalDisc: Number(0),
  };

  const reducer = (state: State, row: ConsolidatedReportItem): State => {
    let {
      // eslint-disable-next-line prefer-const
      payModeBillNo,
      // eslint-disable-next-line prefer-const
      payInfoBillNo,
      sumFoodTotal,
      sumBeerTotal,
      sumLiquorTotal,
      sumGrandTotal,
      sumBillTotal,
      sumCgstTotal,
      sumSgstTotal,
      sumTotalDisc,
    } = state;

    payModeBillNo.set(row.billNo.toString(), row.paymentType);
    payInfoBillNo.set(row.billNo.toString(), row);
    sumFoodTotal += row.foodAmount;
    sumLiquorTotal += row.liquorAmount;
    sumBeerTotal += row.beerAmount;
    sumGrandTotal += row.grandTotal;
    sumBillTotal += row.billTotal;
    sumCgstTotal += row.cgstAmount;
    sumSgstTotal += row.sgstAmount;
    sumTotalDisc += row.discountAmount;

    return {
      payModeBillNo,
      payInfoBillNo,
      sumFoodTotal,
      sumBeerTotal,
      sumLiquorTotal,
      sumGrandTotal,
      sumBillTotal,
      sumCgstTotal,
      sumSgstTotal,
      sumTotalDisc,
    };
  };

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

  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchPayModeInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .invoke('report_consolidated_report', {
          reportId,
        })
        .then((res: ConsolidatedReportItem[]) => {
          const billedBills = res.filter(
            (item) => item.orderStatus === 'Billed'
          );
          billedBills.forEach((row) => dispatch(row));
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      showErrorAlert('Invalid Report ID');
    }
  }, [location]);

  useEffect(() => {
    fetchPayModeInfo();
  }, [fetchPayModeInfo]);

  const getPayModeItemRows = (payModeType: string) => {
    const payModeFilteredBills = Array.from(state.payModeBillNo.keys()).reduce(
      (arr, key) => {
        if (state.payModeBillNo.get(key) === payModeType) {
          arr.push(key);
        }
        return arr;
      },
      new Array<string>()
    );

    if (payModeFilteredBills.length > 0) {
      const tableRows = payModeFilteredBills.sort().map((key, ind) => {
        const item = state.payInfoBillNo.get(key);

        let tableNo = item?.tableNumber.toString();
        if (payModeType === 'RoomAccount') {
          tableNo = `${item?.tableNumber} / ${item?.roomNo}`;
        }

        const newLocal = ind + 1;
        return (
          <tr key={newLocal} className="PayModeItemRow">
            <td key="BNo">{item?.billId}</td>
            <td key="TNo">{tableNo}</td>
            <td key="BeerAmt">{item?.beerAmount}</td>
            <td key="LiquorAmt">{item?.liquorAmount}</td>
            <td key="FoodAmt">{item?.foodAmount}</td>
            <td key="CgstAmt">{item?.cgstAmount.toFixed(3)}</td>
            <td key="SgstAmt">{item?.sgstAmount.toFixed(3)}</td>
            <td key="BillAmt">{item?.billTotal}</td>
            <td key="Disc">{item?.discountAmount}</td>
            <td key="NetAmt">{item?.grandTotal}</td>
          </tr>
        );
      });

      const totals = payModeFilteredBills.reduce((obj, key) => {
        const foodAmt = obj.get('FOOD') || 0;
        const liquorAmt = obj.get('LIQUOR') || 0;
        const beerAmt = obj.get('BEER') || 0;
        const billAmt = obj.get('BILL') || 0;
        const cgstAmt = obj.get('CGST') || 0;
        const sgstAmt = obj.get('SGST') || 0;
        const discAmt = obj.get('DISC') || 0;
        const netAmt = obj.get('NET') || 0;

        const payInfo = state.payInfoBillNo.get(key);

        obj.set('FOOD', foodAmt + (payInfo?.foodAmount || 0));
        obj.set('LIQUOR', liquorAmt + (payInfo?.liquorAmount || 0));
        obj.set('BEER', beerAmt + (payInfo?.beerAmount || 0));
        obj.set('BILL', billAmt + (payInfo?.billTotal || 0));
        obj.set('CGST', cgstAmt + (payInfo?.cgstAmount || 0));
        obj.set('SGST', sgstAmt + (payInfo?.sgstAmount || 0));
        obj.set('DISC', discAmt + (payInfo?.discountAmount || 0));
        obj.set('NET', netAmt + (payInfo?.grandTotal || 0));

        return obj;
      }, new Map<string, number>());

      tableRows.push(
        <tr key="total" className="PayModeTotalRow">
          <td key="BNo" colSpan={2}>
            Total
          </td>
          <td key="BeerAmt">{totals.get('BEER')}</td>
          <td key="LiquorAmt">{totals.get('LIQUOR')}</td>
          <td key="FoodAmt">{totals.get('FOOD')}</td>
          <td key="CgstAmt">{totals.get('CGST')?.toFixed(3)}</td>
          <td key="SgstAmt">{totals.get('SGST')?.toFixed(3)}</td>
          <td key="BillAmt">{totals.get('BILL')}</td>
          <td key="Disc">{totals.get('DISC')}</td>
          <td key="NetAmt">{totals.get('NET')}</td>
        </tr>
      );

      return tableRows;
    }
    return (
      <tr key={0}>
        <td key="BNo">Nil</td>
        <td key="TNo">Nil</td>
        <td key="BeerAmt">Nil</td>
        <td key="LiquorAmt">Nil</td>
        <td key="FoodAmt">Nil</td>
        <td key="CgstAmt">Nil</td>
        <td key="SgstAmt">Nil</td>
        <td key="BillAmt">Nil</td>
        <td key="Disc">Nil</td>
        <td key="NetAmt">Nil</td>
      </tr>
    );
  };

  const getPayModeReport = () => {
    return PayModeTypes.map((key) => (
      <div key={key} className="PayModeReportContainer">
        <p>
          {' '}
          Paid Mode <span>{key}</span>{' '}
        </p>
        <RBTable striped bordered>
          <thead>
            <tr>
              <th>BNo</th>
              <th>{key === 'RoomAccount' ? 'TNo / RNo' : 'TNo'}</th>
              <th>Beer</th>
              <th>Liquor</th>
              <th>Food</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Bill Amt.</th>
              <th>Disc.</th>
              <th>Net Amt.</th>
            </tr>
          </thead>
          <tbody>{getPayModeItemRows(key)}</tbody>
        </RBTable>
      </div>
    ));
  };

  const generatePdf = () => {
    if (state.payInfoBillNo.size > 0) {
      ipcRenderer.send('report_to_pdf', { fileName: 'paymode-report' });
    } else {
      showErrorAlert('No data available for Pay Mode Report');
    }
  };

  const emailPayModeReport = () => {
    if (state.payInfoBillNo.size > 0) {
      ipcRenderer.send('email_pdf_report', {
        fileName: `PayMode Report - ${location?.state?.reportDateStr}`,
        type: 'paymode',
      });
    } else {
      showErrorAlert('No data available for PayMode Report');
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
                  onClick={emailPayModeReport}
                  block
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
          <p className="PayModePrintHeader" id="print-header">
            {' '}
            PayMode Report of Hotel Bala Regency (
            {store.get('ClientName') || ''}
            ) <br /> {location?.state?.reportDateStr}
          </p>
          <p className="ScreenHeader">
            {' '}
            PayMode Report of Hotel Bala Regency(Dated:{' '}
            {location?.state?.reportDateStr || 'N/A'} ){' '}
          </p>
          <div className="PayModeReport" id="printer-content">
            {getPayModeReport()}

            <div className="PayModeReportContainer">
              <p>
                <span> GRAND TOTALS </span>{' '}
              </p>
              <RBTable striped bordered>
                <thead>
                  <tr>
                    <th>BNo</th>
                    <th>TNo</th>
                    <th>Beer</th>
                    <th>Liquor</th>
                    <th>Food</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>Bill Amt.</th>
                    <th>Disc.</th>
                    <th>Net Amt.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr key="GrandTotalRow">
                    <td key="BNo">---</td>
                    <td key="TNo">---</td>
                    <td key="Beer">{state.sumBeerTotal}</td>
                    <td key="Liquor">{state.sumLiquorTotal}</td>
                    <td key="Food">{state.sumFoodTotal}</td>
                    <td key="CgstAmt">{state.sumCgstTotal.toFixed(3)}</td>
                    <td key="SgstAmt">{state.sumSgstTotal.toFixed(3)}</td>
                    <td key="BillAmt">{state.sumBillTotal}</td>
                    <td key="Disc">{state.sumTotalDisc}</td>
                    <td key="NetAmt">{state.sumGrandTotal}</td>
                  </tr>
                </tbody>
              </RBTable>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type State = {
  payModeBillNo: Map<string, string>;
  payInfoBillNo: Map<string, ConsolidatedReportItem>;
  sumGrandTotal: number;
  sumBillTotal: number;
  sumFoodTotal: number;
  sumLiquorTotal: number;
  sumBeerTotal: number;
  sumCgstTotal: number;
  sumSgstTotal: number;
  sumTotalDisc: number;
};

export default PayModeReport;
