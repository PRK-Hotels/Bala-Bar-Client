import React, { createRef, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import ModalHeader from 'react-bootstrap/esm/ModalHeader';

const ConfirmModal = ({
  show,
  closeCallback,
  positiveCallback,
  negativeCallback,
  headerText,
  bodyText,
}: ConfirmModalProps) => {
  const innerRef = createRef<HTMLButtonElement>();

  useEffect(() => {
    setTimeout(() => {
      innerRef.current?.focus();
    }, 1);
  });

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      onHide={() => {}}
    >
      <ModalHeader>
        <Button variant="none" size="sm" onClick={closeCallback}>
          X
        </Button>
      </ModalHeader>
      <Modal.Body>
        <h4>{headerText}</h4>
        <p>{bodyText}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button size="lg" ref={innerRef} onClick={positiveCallback}>
          Yes
        </Button>
        <Button variant="secondary" size="lg" onClick={negativeCallback}>
          No
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

type ConfirmModalProps = {
  show: boolean;
  headerText: string;
  bodyText: string;
  positiveCallback:
    | ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
  negativeCallback:
    | ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
  // eslint-disable-next-line react/require-default-props
  closeCallback?:
    | ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
};

export default ConfirmModal;
