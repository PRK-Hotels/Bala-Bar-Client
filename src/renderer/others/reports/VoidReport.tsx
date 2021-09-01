import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { Form, Col, Row, Button, Table as RBTable } from 'react-bootstrap';

import AlertView from '../../utils/AlertView';
import { VoidReportItems } from '../../../shared';

import './VoidReport.global.css';

const { ipcRenderer, store } = window.electron;

interface LocationState {
  reportId: number;
  reportDateStr: string;
  today: boolean;
}

// ipcRenderer.on("emailed-void-pdf", (event: any) => {
//   const message = `Emailed Void PDF`;
//   alert(message);
// });

const VoidReport: React.FC = () => {
  const { push } = useHistory();
  const location = useLocation<LocationState>();

  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

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

  const [voidItemsMap, setVoidItemsMap] = useState<
    Map<number, VoidReportItems[]>
  >(new Map());

  const fetchVoidInfo = useCallback(() => {
    const reportId = location.state?.reportId || 0;
    if (reportId > 0) {
      ipcRenderer
        .invoke('report_fetch_void_report', { reportId })
        .then((res: VoidReportItems[]) => {
          setVoidItemsMap(
            res.reduce((obj, row) => {
              const items = obj.get(row.tableNumber);
              if (items) {
                items.push(row);
              } else {
                const newItemsList: VoidReportItems[] = [];
                newItemsList.push(row);
                obj.set(row.tableNumber, newItemsList);
              }
              return obj;
            }, new Map<number, VoidReportItems[]>())
          );
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
    fetchVoidInfo();
  }, [fetchVoidInfo]);

  const getVoidItems = () => {
    if (voidItemsMap.size > 0) {
      const tableNos = Array.from(voidItemsMap.keys());
      return tableNos.map((key, _) => {
        const info = voidItemsMap.get(key) || [];
        const rows = [];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < info.length; i++) {
          const row = info[i];
          rows.push(
            <tr key={`${key}_${i}`}>
              <td key={`${key}_${i}_TableNo`}>{row.tableNumber}</td>
              <td key={`${key}_${i}_Captain`}>{row.captainName}</td>
              <td key={`${key}_${i}_KotNo`}>{row.kotNo}</td>
              <td key={`${key}_${i}_Name`}>{row.itemName}</td>
              <td key={`${key}_${i}_Qty`}>{row.itemQty}</td>
            </tr>
          );
        }
        return rows;
      });
    }
    return [];
  };

  const generatePdf = () => {
    if (voidItemsMap.size > 0) {
      ipcRenderer.send('report_to_pdf', { fileName: 'void-report' });
    } else {
      showErrorAlert('No data available for Void Report');
    }
  };

  const emailVoidReport = () => {
    if (voidItemsMap.size > 0) {
      ipcRenderer.send('email_pdf_report', {
        fileName: `Void Report - ${location?.state?.reportDateStr}`,
        type: 'void',
      });
    } else {
      showErrorAlert('No data available for Void Report');
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
                  onClick={emailVoidReport}
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
          <p className="VoidPrintHeader" id="print-header">
            {' '}
            Void Report of Hotel Bala Regency ({store.get('ClientName') ||
              ''}) <br /> {location?.state?.reportDateStr}
          </p>
          <p className="ScreenHeader">
            {' '}
            Void Report of Hotel Bala Regency (Dated:{' '}
            {location?.state?.reportDateStr || 'N/A'} ){' '}
          </p>
          <div className="VoidReport" id="printer-content">
            <RBTable striped bordered>
              <thead>
                <tr>
                  <th>Table No</th>
                  <th>Captain</th>
                  <th>Kot No</th>
                  <th>Item Name</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>{getVoidItems()}</tbody>
            </RBTable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoidReport;
