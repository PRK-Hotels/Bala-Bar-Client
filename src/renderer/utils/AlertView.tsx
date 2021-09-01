import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertView = ({
  show,
  setShow,
  isError,
  heading,
  body,
}: AlertViewPropsType) => {
  // setTimeout(() => setShow(false), 1500);

  return (
    <>
      <Alert
        show={show}
        variant={isError ? 'danger' : 'success'}
        onClose={() => setShow(false)}
        dismissible
      >
        <Alert.Heading>{heading}</Alert.Heading>
        <hr />
        <p>{body}</p>
      </Alert>
    </>
  );
};

type AlertViewPropsType = {
  show: boolean;
  isError: boolean;
  heading: string;
  body: string;
  setShow: (showAlert: boolean) => void;
};

export default AlertView;
