import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { isAfter, isBefore, isSameDay, differenceInDays } from 'date-fns';

import { Form, Col, Row, Button } from 'react-bootstrap';
import Calendar, { OnChangeDateCallback } from 'react-calendar';

import { ReportInfo } from '../../shared/models';

import '../../assets/styles/react-calendar.global.css';
import './Reports.global.css';
import AlertView from './utils/AlertView';
import ConfirmModal from './utils/Modal';

const { ipcRenderer } = window.electron;

const Reports: React.FC<ReportsProps> = (props: ReportsProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dayDiff, setDayDiff] = useState<number>(0);

  const { push } = useHistory();
  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const [showAlertView, setShowAlertView] = useState<boolean>(false);
  const [modalShow, setModalShow] = useState<boolean>(false);

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

  const showSuccessAlert = (message: string) => {
    setAlertParams({
      body: message,
      heading: 'Success',
      isError: false,
    });

    setShowAlertView(true);
  };

  const clearance = () => {
    ipcRenderer
      .invoke('report_clearance')
      .then((err: { msg: string } | undefined) => {
        if (err) {
          showErrorAlert(err.msg || 'Failed to close the report');
        } else {
          // eslint-disable-next-line promise/no-nesting
          ipcRenderer
            .invoke('report_fetch_ref')
            .then((res: { err: null | string; report: null | ReportInfo }) => {
              if (res.report) {
                props.reportUpdater(res.report);
              } else {
                showErrorAlert(res.err || 'Unknown Error Message');
              }
              return '';
            })
            .catch((innerErr: unknown) => {
              console.log(innerErr);
            });
          showSuccessAlert('Report Closed');
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  };

  const generateVoidReport = () => {
    const reportId = props.reportInfo.curReportId - dayDiff;
    if (selectedDate && reportId >= 0) {
      push({
        pathname: '/void-report',
        state: {
          reportId,
          reportDateStr: selectedDate.toDateString(),
          today: dayDiff === 0,
        },
      });
    } else {
      showErrorAlert('No Reports Available');
    }
  };

  const generateCashierReport = () => {
    const reportId = props.reportInfo.curReportId - dayDiff;
    if (selectedDate && reportId >= 0) {
      push({
        pathname: '/cashier-report',
        state: {
          reportId,
          reportDateStr: selectedDate.toDateString(),
          today: dayDiff === 0,
        },
      });
    } else {
      showErrorAlert('No Reports Available');
    }
  };

  const generatePayModeReport = () => {
    const reportId = props.reportInfo.curReportId - dayDiff;
    if (selectedDate && reportId >= 0) {
      push({
        pathname: '/pay-mode-report',
        state: {
          reportId,
          reportDateStr: selectedDate.toDateString(),
          today: dayDiff === 0,
        },
      });
    } else {
      showErrorAlert('No Reports Available');
    }
  };

  const generateItemWiseReport = () => {
    const reportId = props.reportInfo.curReportId - dayDiff;
    if (selectedDate && reportId >= 0) {
      push({
        pathname: '/item-wise-report',
        state: {
          reportId,
          reportDateStr: selectedDate.toDateString(),
          today: dayDiff === 0,
        },
      });
    } else {
      showErrorAlert('No Reports Available');
    }
  };

  const tileDisabled = (
    c: { date: Date; view: string },
    curTransDate: Date,
    startDate: Date
  ) => {
    if (c.view === 'month') {
      return (
        isAfter(c.date, curTransDate) ||
        isBefore(c.date, startDate || curTransDate)
      );
    }
    return false;
  };

  const tileClassName = (
    c: { date: Date; view: string },
    curTransDate: Date
  ) => {
    if (c.view === 'month') {
      if (isSameDay(c.date, curTransDate)) {
        return 'curTransDate';
      }
    }
    return '';
  };

  const handleDateChange: OnChangeDateCallback = (date: Date | Date[]) => {
    if (Array.isArray(date)) {
      showErrorAlert('More than one date is not supported');
    } else {
      setSelectedDate(date);

      const diff = differenceInDays(props.reportInfo.curReportDate, date);
      setDayDiff(diff);
      // console.log("Diff: ", diff, " CurReportID: ", props.reportInfo.curReportId);
    }
  };

  return (
    <div className="Container">
      <AlertView
        show={showAlertView}
        setShow={setShowAlertView}
        isError={alertParams.isError}
        body={alertParams.body}
        heading={alertParams.heading}
      />
      <ConfirmModal
        show={modalShow}
        headerText="Account Clearance"
        bodyText="Confirm closing account for the transaction date?"
        positiveCallback={() => {
          setModalShow(false);
          clearance();
        }}
        negativeCallback={() => {
          setModalShow(false);
        }}
        closeCallback={() => {
          setModalShow(false);
        }}
      />

      <div className="TableInfo">
        <Form>
          <Form.Group as={Row} className="ReportFormGroup">
            <Form.Label column sm={2} lg={4} />
            <Col sm={8} lg={4}>
              <Button
                variant="danger"
                onClick={(e) => setModalShow(true)}
                block
              >
                Clearance
              </Button>
            </Col>
            <Form.Label column sm={2} lg={4} />
          </Form.Group>
          <Form.Group as={Row} className="ReportFormGroup">
            <Calendar
              selectRange={false}
              tileDisabled={(c) =>
                tileDisabled(
                  c,
                  props.reportInfo.curReportDate,
                  props.reportInfo.startDate
                )
              }
              tileClassName={(c) =>
                tileClassName(c, props.reportInfo.curReportDate)
              }
              onChange={handleDateChange}
            />
          </Form.Group>
          <Form.Group as={Row} className="ReportFormGroup">
            <Form.Label column sm={2} lg={4} />
            <Col sm={8} lg={4}>
              <Button variant="primary" onClick={generateVoidReport} block>
                Void Report
              </Button>
            </Col>
            <Form.Label column sm={2} lg={4} />
          </Form.Group>
          <Form.Group as={Row} className="ReportFormGroup">
            <Form.Label column sm={2} lg={4} />
            <Col sm={8} lg={4}>
              <Button variant="primary" onClick={generateCashierReport} block>
                Cashier Report
              </Button>
            </Col>
            <Form.Label column sm={2} lg={4} />
          </Form.Group>
          <Form.Group as={Row} className="ReportFormGroup">
            <Form.Label column sm={2} lg={4} />
            <Col sm={8} lg={4}>
              <Button variant="primary" onClick={generatePayModeReport} block>
                Pay Mode Report
              </Button>
            </Col>
            <Form.Label column sm={2} lg={4} />
          </Form.Group>
          <Form.Group as={Row} className="ReportFormGroup">
            <Form.Label column sm={2} lg={4} />
            <Col sm={8} lg={4}>
              <Button variant="primary" onClick={generateItemWiseReport} block>
                Item Wise Report
              </Button>
            </Col>
            <Form.Label column sm={2} lg={4} />
          </Form.Group>
        </Form>
      </div>
    </div>
  );
};

type ReportsProps = {
  reportInfo: ReportInfo;
  reportUpdater: React.Dispatch<React.SetStateAction<ReportInfo | undefined>>;
};

export default Reports;
