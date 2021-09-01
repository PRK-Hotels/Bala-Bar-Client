import React, { useCallback, useState } from 'react';

import {
  Form,
  Col,
  Row,
  Button,
  InputGroup,
  Table as RBTable,
} from 'react-bootstrap';
import {
  BillAmountInfo,
  OriginalBillInfo,
  AggregateItemInfo,
} from '../../shared';
import AlertView from '../utils/AlertView';

import './BillHistory.global.css';

const { ipcRenderer } = window.electron;

const BillHistory: React.FC = () => {
  const [billId, setBillId] = useState<string>('');
  const [billAmountInfo, setBillAmountInfo] =
    useState<BillAmountInfo | undefined>(undefined);
  const [ogBillInfo, setOgBillInfo] =
    useState<OriginalBillInfo | undefined>(undefined);
  const [billInfoItems, setBillInfoItems] = useState<AggregateItemInfo[]>([]);

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

  const fetchBillDetails = useCallback(() => {
    if (billId) {
      ipcRenderer
        .invoke('bill_get_duplicate', { billId })
        .then(
          (res: {
            originalBillInfo: OriginalBillInfo;
            billAmountInfo: BillAmountInfo;
            itemsInfo: [AggregateItemInfo];
          }) => {
            // console.log(res);
            const isEmpty =
              Object.keys(res).length === 0 && res.constructor === Object;
            if (isEmpty) {
              console.error('Empty Response for Duplicate Bill');
            } else {
              setBillAmountInfo(res.billAmountInfo);
              setBillInfoItems(res.itemsInfo);
              setOgBillInfo(res.originalBillInfo);

              console.log(res.originalBillInfo);
              console.log(res.billAmountInfo);
              console.log(res.itemsInfo);
            }
            return '';
          }
        )
        .catch((err: any) => {
          console.log(err);
        });
    }
  }, [billId]);

  const printDuplicateBill = useCallback(() => {
    if (billId) {
      ipcRenderer
        .invoke('bill_print_duplicate', { billId })
        .then((err: any) => {
          if (err) {
            console.log(err.msg);
          } else {
            console.log('Duplicate Bill Printed');
          }
          return '';
        })
        .catch((err: any) => {
          console.log(err);
        });
    }
  }, [billId]);

  const getBillHeader = () => {
    if (ogBillInfo) {
      return (
        <div>
          <Form.Group as={Row} style={{ marginTop: '48px' }}>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'left', fontWeight: 800 }}
            >
              {' '}
              Table No: {ogBillInfo.tableNumber}{' '}
            </Form.Label>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'center', fontWeight: 800 }}
            >
              Captain Name
            </Form.Label>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'right', fontWeight: 800 }}
            >
              {' '}
              Date: {ogBillInfo.billDate}{' '}
            </Form.Label>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'left', fontWeight: 800 }}
            >
              {' '}
              Bill #: {billId}{' '}
            </Form.Label>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'center', fontWeight: 800 }}
            >
              {ogBillInfo.captainName}
            </Form.Label>
            <Form.Label
              column
              sm={4}
              style={{ textAlign: 'right', fontWeight: 800 }}
            >
              {' '}
              Time: {ogBillInfo.billTime}{' '}
            </Form.Label>
          </Form.Group>
        </div>
      );
    }
    return '';
  };

  const getBillItems = () => {
    if (billInfoItems && billInfoItems.length > 0) {
      const billTable = billInfoItems.map((i, ind) => {
        const newLocal = ind + 1;
        return (
          <tr key={newLocal}>
            <td key="ItemName">{i.itemName}</td>
            <td key="Rate">{i.itemRate}</td>
            <td key="Qty">{i.itemQty}</td>
            <td key="Amount">{i.itemTotal}</td>
          </tr>
        );
      });

      billTable.push(
        <tr key="gray">
          <td key="SubTotalName" colSpan={4} style={{ background: 'gray' }} />
        </tr>,
        <tr key="SubTotal">
          <td key="SubTotalName" colSpan={3} style={{ fontWeight: 700 }}>
            Sub Total
          </td>
          <td key="SubTotalValue" style={{ fontWeight: 700 }}>
            {billAmountInfo?.total}
          </td>
        </tr>,
        <tr key="CGST">
          <td key="CGSTName" colSpan={3} style={{ fontWeight: 700 }}>
            C-GST
          </td>
          <td key="CGSTValue" style={{ fontWeight: 700 }}>
            {billAmountInfo?.cgstAmount.toFixed(3)}
          </td>
        </tr>,
        <tr key="SGST">
          <td key="SGSTName" colSpan={3} style={{ fontWeight: 700 }}>
            S-GST
          </td>
          <td key="SGSTValue" style={{ fontWeight: 700 }}>
            {billAmountInfo?.sgstAmount.toFixed(3)}
          </td>
        </tr>,
        <tr key="GrandTotal">
          <td
            key="GrandTotalName"
            colSpan={3}
            style={{ fontWeight: 700, color: 'red' }}
          >
            Grand Total
          </td>
          <td key="GrandTotalValue" style={{ fontWeight: 700, color: 'red' }}>
            {billAmountInfo?.grandTotal}
          </td>
        </tr>
      );

      return billTable;
    }
    return <tr />;
  };

  return (
    <div className="BillHistoryContainer">
      <AlertView
        show={showAlertView}
        setShow={setShowAlertView}
        isError={alertParams.isError}
        body={alertParams.body}
        heading={alertParams.heading}
      />
      <Form.Group as={Row} className="FormButtons">
        <Form.Label column sm={3} />
        <InputGroup className="mb-3" as={Col} sm={6}>
          <InputGroup.Prepend>
            <InputGroup.Text id="table-no">Table No</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            required
            placeholder="Bill Id"
            value={billId || ''}
            onChange={(e) => {
              try {
                setBillId(e.target.value || '');
                setBillAmountInfo(undefined);
                setOgBillInfo(undefined);
                setBillInfoItems([]);
              } catch (err) {
                showErrorAlert('Enter valid bill no');
                setBillId('');
              }
            }}
          />
          <Form.Label column sm={3} />
        </InputGroup>
      </Form.Group>
      <Form.Group as={Row} className="FormButtons">
        <Form.Label column sm={1} />
        <Col sm={4}>
          <Button onClick={fetchBillDetails} block>
            Fetch Bill
          </Button>
        </Col>
        <Form.Label column sm={2} />
        <Col sm={4}>
          <Button
            block
            disabled={billAmountInfo === undefined}
            onClick={printDuplicateBill}
          >
            Print Bill
          </Button>{' '}
        </Col>
        <Form.Label column sm={1} />
      </Form.Group>
      {getBillHeader()}
      <RBTable bordered>
        <thead>
          <tr>
            <th>Item</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>{getBillItems()}</tbody>
      </RBTable>
    </div>
  );
};

export default BillHistory;
