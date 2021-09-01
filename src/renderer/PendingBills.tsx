/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  Form,
  Col,
  Table as RBTable,
  InputGroup,
  Button,
  Modal,
} from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import axios from 'axios';

import './PendingBills.global.css';
import { PendingBillInfo, RoomGuestInfo } from '../../shared/models';
import PayModeTypes from './utils/PayModeTypes';
import AlertView from './utils/AlertView';

const { ipcRenderer, store } = window.electron;

const PendingBills: React.FC = () => {
  const SERVER_IP = (store.get('ServerIP') as string) || '';
  const AUTH_ENABLED = (store.get('AuthEnabled') as boolean) || false;

  const [pendingBillsMap, setPendingBillsMap] = useState<
    Map<number, PendingBillInfo>
  >(new Map());
  const [curTableNo, setCurTableNo] = useState<number>(-1);
  const [billInfo, setBillInfo] =
    useState<PendingBillInfo | undefined>(undefined);
  const [paymentMode, setPaymentMode] = useState<string | undefined>(undefined);
  const [payModeDisabled, setPayModeDisabled] = useState<boolean>(false);

  const [modalShow, setModalShow] = React.useState(false);
  const [roomInfo, setRoomInfo] = React.useState<Array<RoomGuestInfo>>([]);

  const { push } = useHistory();
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

  const showSuccessAlert = (message: string) => {
    setAlertParams({
      body: message,
      heading: 'Success',
      isError: false,
    });

    setShowAlertView(true);
  };

  const iGuestNameRef = useRef<HTMLSpanElement>(null);
  const iGuestMobileRef = useRef<HTMLSpanElement>(null);
  const iRoomNoRef = useRef<HTMLSpanElement>(null);

  const handleRoomChange = (
    selected: { label: string; index: number; guestInfo: RoomGuestInfo }[]
  ) => {
    const index = selected[0]?.index;
    const gi = selected[0]?.guestInfo;

    if (
      iGuestNameRef.current &&
      iGuestMobileRef.current &&
      iRoomNoRef.current
    ) {
      iGuestNameRef.current.innerText = '';
      iGuestMobileRef.current.innerText = '';
      iRoomNoRef.current.innerText = '';

      if (index >= 0 && gi) {
        iGuestNameRef.current.innerText = `${gi.firstName} ${gi.lastName}`;
        iGuestMobileRef.current.innerText = gi.contact;
        iRoomNoRef.current.innerText = gi.roomNo.toString();
      } else {
        console.log('Invalid Selection');
      }
    }
  };

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

  useEffect(() => {
    fetchPendingTablesInfo();
  }, [fetchPendingTablesInfo]);

  const clearForm = () => {
    setCurTableNo(-1);
    setBillInfo(undefined);
    setPaymentMode(undefined);
    setPayModeDisabled(false);
  };

  const MyVerticallyCenteredModal = (props: {
    show: boolean;
    onHide: (e: any) => void;
  }) => {
    const submitBillToRoom = useCallback(() => {
      if (
        iRoomNoRef &&
        iRoomNoRef.current &&
        iRoomNoRef.current.innerText.trim().length > 0
      ) {
        const roomNo = iRoomNoRef.current.innerText;
        ipcRenderer
          .invoke('bill_submitToRoom', {
            roomNo,
            billInfo,
          })
          .then((res: { err: { message: string; code: number } }) => {
            setModalShow(false);
            if (res.err) {
              showErrorAlert('Bill was not processed');
              console.error(res.err.message);
            } else {
              showSuccessAlert('Bill successfully posted to the room.');
              clearForm();
              fetchPendingTablesInfo();
            }
            return '';
          })
          .catch((err: unknown) => {
            console.log(err);
          });
      }
    }, []);

    return (
      <Modal
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Room Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Room No</h4>
          <Typeahead
            multiple={false}
            id="room-number"
            options={roomInfo.map((i, ind) => ({
              label: i.roomNo > 0 ? i.roomNo.toString() : '',
              index: ind,
              guestInfo: i,
            }))}
            placeholder=""
            onChange={handleRoomChange}
          />
          <p>
            Guest Name: <span ref={iGuestNameRef} />
          </p>
          <p>
            Guest Mobile: <span ref={iGuestMobileRef} />
          </p>
          <p>
            Guest Room No: <span ref={iRoomNoRef} />
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.onHide}>
            Close
          </Button>
          <Button variant="danger" onClick={(e) => submitBillToRoom()}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const getPendingBillsInfo = () => {
    const tableNos = Array.from(pendingBillsMap.keys());
    if (tableNos.length > 0) {
      return tableNos.map((key, index) => {
        const info = pendingBillsMap.get(key);
        return (
          <tr key={index}>
            <td key={`${index}_TableNo`}>{info?.tableNumber}</td>
            <td key={`${index}_BillId`}>{info?.billId}</td>
            <td key={`${index}_Total`}>{info?.billGrandTotal}</td>
          </tr>
        );
      });
    }
    return [];
  };

  const handleTableSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value && e.target.value !== '') {
      const tableNumber = Number.parseInt(e.target.value, 10);
      if (
        pendingBillsMap.has(tableNumber) &&
        pendingBillsMap.get(tableNumber)
      ) {
        const info = pendingBillsMap.get(tableNumber);
        setCurTableNo(tableNumber);
        setBillInfo(info);

        // const disablePayMode = ["Swiggy", "Zomato"].includes(info?.orderType || "");
        // setPayModeDisabled(disablePayMode);
        // if (disablePayMode) {
        //   setPaymentMode(info?.orderType);
        // }

        console.log(info);
      } else {
        console.error('No pending items for selected table');
        clearForm();
      }
    } else {
      clearForm();
      console.error('Invalid Table No');
    }
  };

  const handlePaymentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value && e.target.value !== '') {
      setPaymentMode(e.target.value);
    } else {
      setPaymentMode(undefined);
      console.error('Invalid Payment Mode');
    }
  };

  const clearPendingBill = useCallback(() => {
    if (curTableNo > 0 && paymentMode && billInfo) {
      console.log('Clearning Pending Bill');
      ipcRenderer
        .invoke('bill_clear_pending', {
          tableNo: curTableNo,
          billNo: billInfo.billNo,
          billId: billInfo.billId,
          orderId: billInfo.orderId,
          payMode: paymentMode,
        })
        .then((err: { msg: string } | undefined) => {
          clearForm();
          if (err) {
            console.log('Failed to clear pending bill', err);
          } else {
            fetchPendingTablesInfo();
          }
          return '';
        })
        .catch((err: unknown) => {
          console.log(err);
        });
    } else {
      console.log('Select Table No & Payment Mode');
    }
  }, [curTableNo, paymentMode, billInfo, fetchPendingTablesInfo]);

  const addBillToRoom = () => {
    setRoomInfo([]);
    if (curTableNo > 0 && billInfo) {
      const PATH = '/api/restaurant/getAllCheckedRooms';
      let headers;
      if (AUTH_ENABLED) {
        headers = ipcRenderer.sendSync('bryo-auth-get-header', { path: PATH });
        if (headers.err) {
          showErrorAlert('Error Generating Auth Headers');
          return;
        }
      }

      axios
        .get<[RoomGuestInfo]>(`${SERVER_IP}${PATH}`, {
          headers,
        })
        .then((res) => {
          const tempRoomInfo = res.data;
          if (tempRoomInfo && tempRoomInfo.length > 0) {
            console.log(tempRoomInfo);
            setRoomInfo(tempRoomInfo);
            setModalShow(true);
          } else {
            showErrorAlert('Invalid response');
          }
          return '';
        })
        .catch((err) => {
          showErrorAlert('Network Error Occurred');
          console.log(err);
        });
    } else {
      showErrorAlert('Select valid bill to post to room');
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
      <div className="PB_Container">
        <MyVerticallyCenteredModal
          show={modalShow}
          onHide={() => setModalShow(false)}
        />
        <div className="PB_LeftPane">
          <Form>
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={3} />
              <InputGroup className="mb-3" as={Col} sm={6}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="table-no">Table No</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  as="select"
                  placeholder=""
                  onChange={handleTableSelect}
                  value={curTableNo > 0 ? curTableNo : ''}
                  disabled={pendingBillsMap.size === 0}
                >
                  {['', ...Array.from(pendingBillsMap.keys())].map(
                    (tableNo, index) => (
                      <option key={tableNo} value={tableNo}>
                        {tableNo}
                      </option>
                    )
                  )}
                </Form.Control>
              </InputGroup>
              <Form.Group as={Col} sm={3} />
            </Form.Row>
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={3} />
              <InputGroup className="mb-3" as={Col} sm={6}>
                <InputGroup.Prepend>
                  <InputGroup.Text id="payment-type">Payment</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  as="select"
                  placeholder=""
                  onChange={handlePaymentSelect}
                  disabled={payModeDisabled}
                  value={paymentMode || ''}
                >
                  {['', ...PayModeTypes].map((mode, ind) => (
                    <option
                      key={mode}
                      value={mode}
                      hidden={ind === PayModeTypes.length}
                    >
                      {mode}
                    </option>
                  ))}
                </Form.Control>
              </InputGroup>
              <Form.Group as={Col} sm={3} />
            </Form.Row>
            <br />
            <br />
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={3} />
              <Col sm={6}>
                <Button variant="flat" block onClick={clearPendingBill}>
                  Clear Bill
                </Button>
              </Col>
              <Form.Group as={Col} sm={3} />
            </Form.Row>
            <Form.Row className="FormRow">
              <Form.Group as={Col} sm={3} />
              <Col sm={6}>
                <Button variant="danger" block onClick={addBillToRoom}>
                  Bill to Room
                </Button>
              </Col>
              <Form.Group as={Col} sm={3} />
            </Form.Row>
          </Form>
        </div>
        <div className="PB_RightPane">
          <div className="Table">
            <RBTable striped bordered>
              <thead>
                <tr>
                  <th>Table No</th>
                  <th>Bill No</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>{getPendingBillsInfo()}</tbody>
            </RBTable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingBills;
