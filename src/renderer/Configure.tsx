import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { Form, Col, Row, Button, Accordion, Card } from 'react-bootstrap';

import './Configure.global.css';

const { ipcRenderer, store } = window.electron;

const Configure: React.FC = () => {
  const { push } = useHistory();
  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newServerIPAddr, setNewServerIPAddr] = useState('');
  const [newPrinterIPAddr, setNewPrinterIPAddr] = useState('');
  const [newClientName, setClientName] = useState('');

  const [authEnabled, setAuthEnabled] = useState<boolean>(
    (store.get('AuthEnabled') as boolean) || false
  );
  const [authAccessKey, setAuthAccessKey] = useState<string>(
    (store.get('AuthAccessKey') as string) || ''
  );
  const [authSecretKey, setAuthSecretKey] = useState<string>(
    (store.get('AuthSecretKey') as string) || ''
  );
  const [serverSubmitEnabled, setServerSubmitEnabled] = useState(false);

  const resetForm = (): void => {
    setCurPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewServerIPAddr('');
    setNewPrinterIPAddr('');
    setClientName('');

    setServerSubmitEnabled(false);
    setAuthEnabled(store.get('AuthEnabled') as boolean);
    setAuthAccessKey(store.get('AuthAccessKey') as string);
    setAuthSecretKey(store.get('AuthSecretKey') as string);
  };

  const resetAdminPassword = () => {
    ipcRenderer
      .invoke('change-admin-password', {
        curPassword,
        newPassword,
      })
      .then((res: { err: { msg: string; code: number } | undefined }) => {
        if (res.err) {
          alert('Failed to change password');
        }
        resetForm();
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  };

  useEffect(() => {
    const curAuthEnabled = (store.get('AuthEnabled') as boolean) || false;
    const curAccessKey = (store.get('AuthAccessKey') as string) || '';
    const curSecretKey = (store.get('AuthSecretKey') as string) || '';

    setServerSubmitEnabled(
      newServerIPAddr.trim().length > 0 ||
        curAuthEnabled !== authEnabled ||
        curAccessKey !== authAccessKey ||
        curSecretKey !== authSecretKey
    );
  }, [authAccessKey, authEnabled, authSecretKey, newServerIPAddr]);

  const updateServerDetails = () => {
    if (newServerIPAddr.trim().length > 0) {
      store.set('ServerIP', newServerIPAddr);
      console.log('Updated Server IP');
    }

    if (
      authEnabled &&
      authAccessKey.trim().length > 0 &&
      authSecretKey.trim().length > 0
    ) {
      store.set('AuthEnabled', authEnabled);
      store.set('AuthAccessKey', authAccessKey);
      store.set('AuthSecretKey', authSecretKey);
    } else {
      store.set('AuthEnabled', false);
      store.set('AuthAccessKey', '');
      store.set('AuthSecretKey', '');
    }
    resetForm();
  };

  const updatePrinterIP = () => {
    store.set('PrinterIP', newPrinterIPAddr);
    resetForm();
  };

  const updateClientName = () => {
    store.set('ClientName', newClientName);
    resetForm();
  };

  return (
    <div className="Container">
      <div className="ItemInfo">
        <Accordion>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} eventKey="4">
                Client Name
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="4">
              <Card.Body>
                <Form>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Form.Label column sm={4}>
                      {' '}
                      Name: {store.get('ClientName')}{' '}
                    </Form.Label>
                    <Form.Label column sm={4} />
                  </Row>
                  {store.get('ClientName') ? (
                    ''
                  ) : (
                    <div>
                      <Row className="AccordionRow">
                        <Form.Label column sm={4} />
                        <Col sm={4}>
                          <Form.Control
                            placeholder="Reception"
                            value={newClientName}
                            onChange={(e) => setClientName(e.target.value)}
                          />
                        </Col>
                        <Form.Label column sm={4} />
                      </Row>
                      <Row className="AccordionRow">
                        <Form.Label column sm={4} />
                        <Col sm={4}>
                          <Button
                            onClick={updateClientName}
                            disabled={!!store.get('ClientName')}
                          >
                            Update
                          </Button>
                        </Col>
                        <Form.Label column sm={4} />
                      </Row>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} eventKey="2">
                Change Server IP
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="2">
              <Card.Body>
                <Form>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Form.Label column sm={4}>
                      {' '}
                      IP Addr: {store.get('ServerIP')}{' '}
                    </Form.Label>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        placeholder="New IP Address"
                        value={newServerIPAddr}
                        onChange={(e) =>
                          setNewServerIPAddr(e.target.value.trim())
                        }
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Switch
                        id="authorization"
                        label="Enable Authorization"
                        checked={authEnabled}
                        isValid
                        onChange={() => {
                          setAuthEnabled(!authEnabled);
                        }}
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        placeholder="Access Key"
                        value={authAccessKey}
                        disabled={!authEnabled}
                        onChange={(e) =>
                          setAuthAccessKey(e.target.value.trim())
                        }
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        placeholder="Secret Key"
                        type="password"
                        value={authSecretKey}
                        disabled={!authEnabled}
                        onChange={(e) =>
                          setAuthSecretKey(e.target.value.trim())
                        }
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Button
                        onClick={updateServerDetails}
                        disabled={!serverSubmitEnabled}
                      >
                        Submit
                      </Button>
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} eventKey="1">
                Change Printer IP
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="1">
              <Card.Body>
                <Form>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Form.Label column sm={4}>
                      {' '}
                      IP Addr: {store.get('PrinterIP')}{' '}
                    </Form.Label>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        placeholder="New IP Address"
                        value={newPrinterIPAddr}
                        onChange={(e) =>
                          setNewPrinterIPAddr(e.target.value.trim())
                        }
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Button
                        onClick={updatePrinterIP}
                        disabled={newPrinterIPAddr.trim().length <= 0}
                      >
                        Submit
                      </Button>
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} eventKey="0">
                Change Admin Password
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="0">
              <Card.Body>
                <Form>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        type="password"
                        placeholder="Current Password"
                        value={curPassword}
                        onChange={(e) => {
                          setCurPassword(e.target.value.trim());
                        }}
                      />
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value.trim())}
                      />
                    </Col>
                    <Form.Label column sm={4} style={{ textAlign: 'left' }}>
                      {' '}
                      (Minimum 6 characters){' '}
                    </Form.Label>
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Form.Control
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value.trim())
                        }
                      />
                    </Col>
                    <Form.Label column sm={4} style={{ textAlign: 'left' }}>
                      {' '}
                      (Minimum 6 characters){' '}
                    </Form.Label>
                  </Row>
                  <Row className="AccordionRow">
                    <Form.Label column sm={4} />
                    <Col sm={4}>
                      <Button
                        onClick={resetAdminPassword}
                        disabled={
                          !(
                            curPassword.length >= 6 &&
                            newPassword.length >= 6 &&
                            confirmPassword.length >= 6 &&
                            newPassword === confirmPassword
                          )
                        }
                      >
                        Submit
                      </Button>
                    </Col>
                    <Form.Label column sm={4} />
                  </Row>
                </Form>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    </div>
  );
};

export default Configure;
