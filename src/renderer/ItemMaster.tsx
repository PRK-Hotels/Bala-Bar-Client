/* eslint-disable react/no-array-index-key */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  Form,
  Col,
  Row,
  Button,
  Table,
  InputGroup,
  FormControl,
} from 'react-bootstrap';

import { Item, GstCategory } from '../../shared/models';
import './ItemMaster.global.css';

const { ipcRenderer } = window.electron;

const ItemMaster: React.FC = (props) => {
  const { push } = useHistory();
  useHotkeys('F1', () => push('/kot'));
  useHotkeys('F2', () => push('/billing'));
  useHotkeys('F3', () => push('/pendingBills'));

  const iCode = useRef<HTMLInputElement>(null);
  const iGstCode = useRef<HTMLSelectElement>(null);
  const iName = useRef<HTMLInputElement>(null);
  const iRate = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<string, Item>>(new Map());
  const [gstCategories, setGstCategories] = useState<GstCategory[]>([]);

  const fetchItems = useCallback(() => {
    ipcRenderer
      .invoke('fetchItemsView')
      .then((res: { items: Item[] }) => {
        const isEmpty =
          Object.keys(res).length === 0 && res.constructor === Object;
        if (isEmpty) {
          console.error('Empty Response for Fetch Items View');
        } else {
          setItems(res.items);
          setItemsMap(
            res.items.reduce(
              (obj, row) => obj.set(row.code, row),
              new Map<string, Item>()
            )
          );
          console.log('Items: ', res);
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  const fetchGstCategories = useCallback(() => {
    ipcRenderer
      .invoke('fetchItemCategories')
      .then((res: { gst_categories: GstCategory[] }) => {
        const isEmpty =
          Object.keys(res).length === 0 && res.constructor === Object;
        if (isEmpty) {
          console.error('Empty Response for Fetch GST categories');
        } else {
          setGstCategories(res.gst_categories);
          console.log('GST Categories: ', res.gst_categories);
        }
        return '';
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    fetchItems();
    fetchGstCategories();
  }, [fetchItems, fetchGstCategories]);

  const onSubmit = (): void => {
    console.log('Triggered');
    if (iCode.current !== null) {
      const el = iCode.current;
      const key = el.value;
      if (
        itemsMap.has(key) &&
        iName.current !== null &&
        iRate.current !== null
      ) {
        const item = itemsMap.get(key);
        if (item) {
          iName.current.value = item?.name;
          iRate.current.value = item?.rate.toString();
        }
      }
    }
  };

  const onKeyPress = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      onSubmit();
    }
  };

  const insertOrUpdateItem = (): void => {
    if (
      iCode.current !== null &&
      iName.current !== null &&
      iRate.current !== null &&
      iGstCode.current !== null &&
      iCode.current.value &&
      iName.current.value &&
      iRate.current.value &&
      iGstCode.current.value
    ) {
      const newItem = {
        code: iCode.current.value,
        name: iName.current.value,
        rate: iRate.current.value,
        gst_ref_id: iGstCode.current.value,
      };
      console.log('Saving Item Info', newItem);

      const isUpdate = itemsMap.has(newItem.code);
      const cmd = isUpdate ? 'updateItem' : 'insertItem';
      ipcRenderer
        .invoke(cmd, newItem)
        .then(async (_event: any) => {
          fetchItems();
          return '';
        })
        .catch((err: unknown) => {
          console.log(err);
        });
    } else {
      console.log('Invalid Info');
    }
  };

  const deleteItem = (): void => {
    if (
      iCode.current !== null &&
      iName.current !== null &&
      iRate.current !== null &&
      iCode.current.value &&
      iName.current.value &&
      iRate.current.value
    ) {
      ipcRenderer
        .invoke('deleteItem', iCode.current.value)
        .then(async (_event: any) => {
          fetchItems();
          if (iCode.current !== null) iCode.current.value = '';
          if (iName.current !== null) iName.current.value = '';
          if (iRate.current !== null) iRate.current.value = '';
          return '';
        })
        .catch((err: unknown) => {
          console.log(err);
        });
    } else {
      console.log('Invalid Info');
    }
  };

  const setFormInfo = (index: number): void => {
    if (index >= 0 && index < items.length) {
      if (
        iCode.current != null &&
        iName.current !== null &&
        iRate.current !== null &&
        iGstCode.current !== null
      ) {
        const item = items[index];
        iCode.current.value = item.code;
        iName.current.value = item.name;
        iRate.current.value = item.rate.toString();
        iGstCode.current.selectedIndex = gstCategories
          .map((e) => {
            return e.category;
          })
          .indexOf(item.category);
      }
    }
  };

  const resetForm = (): void => {
    if (iCode.current !== null) iCode.current.value = '';
    if (iName.current !== null) iName.current.value = '';
    if (iRate.current !== null) iRate.current.value = '';
  };

  return (
    <div className="Container">
      <div className="ItemInfo">
        <Form>
          <Row>
            <Col sm={4}>
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text id="item-code">Item Code</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  name="item_code"
                  ref={iCode}
                  onKeyPress={onKeyPress}
                />
              </InputGroup>
            </Col>
            <Col sm={8}>
              <Form.Control placeholder="Item Name" ref={iName} />
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text id="gst-code">Category</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control as="select" ref={iGstCode}>
                  {' '}
                  {gstCategories.map((gst, index) => (
                    <option key={gst.id} value={gst.id}>
                      {gst.category}
                    </option>
                  ))}
                </Form.Control>
              </InputGroup>
            </Col>
            <Col sm={8}>
              <Form.Control
                placeholder="Rate"
                inputMode="numeric"
                ref={iRate}
              />
            </Col>
          </Row>
          <Form.Group as={Row} className="FormButtons">
            <Form.Label column sm={2} />
            <Col sm={2}>
              <Button variant="primary" onClick={insertOrUpdateItem} block>
                Save
              </Button>
            </Col>
            <Form.Label column sm={1} />
            <Col sm={2}>
              <Button variant="secondary" onClick={resetForm} block>
                Cancel
              </Button>{' '}
            </Col>
            <Form.Label column sm={1} />
            <Col sm={2}>
              <Button variant="danger" onClick={deleteItem} block>
                Delete
              </Button>
            </Col>
            <Form.Label column sm={2} />
          </Form.Group>
        </Form>
      </div>
      <div className="Table">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Item Rate</th>
              <th>GST Category</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} onClick={() => setFormInfo(index)}>
                <td key={index}>{index + 1}</td>
                <td key={item.code}>{item.code}</td>
                <td key={`${item.code}_name`}>{item.name}</td>
                <td key={`${item.code}_rate`}>{item.rate}</td>
                <td key={`${item.code}_gst`}>{item.category || 'Unknown'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ItemMaster;
