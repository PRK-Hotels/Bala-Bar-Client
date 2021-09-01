import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { Form, Col, Row, Button, Table as RBTable } from 'react-bootstrap';

import AlertView from '../../utils/AlertView';
import { ItemWiseReportItem } from '../../../shared';

import './ItemWiseReport.global.css';

const { ipcRenderer, store } = window.electron;

interface LocationState {
  reportId: number;
  reportDateStr: string;
  today: boolean;
}

// ipcRenderer.on("emailed-itemwise-pdf", (event: any) => {
//   const message = `Emailed Item Wise PDF`;
//   alert(message);
// });

const PayModeReport: React.FC = () => {
  const { push } = useHistory();
  const location = useLocation<LocationState>();

  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const [reportInfo, setReportInfo] = useState<
    Map<string, Map<string, number>>
  >(new Map());

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

  const fetchItemReportInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .invoke('report_item_wise_report', { reportId })
        .then((res: ItemWiseReportItem[]) => {
          const info = new Map<string, Map<string, number>>();
          res.forEach((e) => {
            const categoryCount =
              info.get(e.category) || new Map<string, number>();
            const count = categoryCount.get(e.itemName) || 0;
            categoryCount.set(e.itemName, count + e.quantity);
            info.set(e.category, categoryCount);
          });
          setReportInfo(info);
          console.log(info);
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      setReportInfo(new Map<string, Map<string, number>>());
      showErrorAlert('Invalid Report ID');
    }
  }, [location]);

  useEffect(() => {
    fetchItemReportInfo();
  }, [fetchItemReportInfo]);

  const getItemReportRows = (category: string) => {
    const itemWiseCount = reportInfo.get(category) || new Map<string, number>();
    if (itemWiseCount.size > 0) {
      const tableRows = Array.from(itemWiseCount.keys())
        .sort()
        .map((key, ind) => {
          const qty = itemWiseCount.get(key);
          const newLocal = ind + 1;
          return (
            <tr key={newLocal}>
              <td key="Description">{key}</td>
              <td key="Qty">{qty}</td>
            </tr>
          );
        });

      return tableRows;
    }
    return (
      <tr key={0}>
        <td key="Description">Nil</td>
        <td key="Qty">Nil</td>
      </tr>
    );
  };

  const getItemWiseReport = () => {
    return Array.from(reportInfo.keys()).map((category) => (
      <div key={category} className="ItemWiseReportContainer">
        <p>
          {' '}
          <span>{category}</span>{' '}
        </p>
        <RBTable striped bordered>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>{getItemReportRows(category)}</tbody>
        </RBTable>
      </div>
    ));
  };

  const generatePdf = () => {
    if (reportInfo.size > 0) {
      ipcRenderer.send('report_to_pdf', { fileName: 'itemwise-report' });
    } else {
      showErrorAlert('No data available for Item Wise Report');
    }
  };

  const emailItemWiseReport = () => {
    if (reportInfo.size > 0) {
      ipcRenderer.send('email_pdf_report', {
        fileName: `ItemWise Report - ${location?.state?.reportDateStr}`,
        type: 'itemwise',
      });
    } else {
      showErrorAlert('No data available for ItemWise Report');
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
      <div className="ItemWiseReportContainer">
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
                  onClick={emailItemWiseReport}
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
          <p className="ItemWisePrintHeader" id="print-header">
            {' '}
            ItemWise Report of Hotel Bala Regency (
            {(store.get('ClientName') as string) || ''}) <br />{' '}
            {location?.state?.reportDateStr}
          </p>
          <p className="ScreenHeader">
            {' '}
            ItemWise Report of Hotel Bala Regency (Dated:{' '}
            {location?.state?.reportDateStr || 'N/A'} ){' '}
          </p>
          <div className="ItemWiseReport" id="printer-content">
            {getItemWiseReport()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayModeReport;
