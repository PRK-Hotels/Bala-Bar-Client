/* eslint-disable no-undef-init */
/* eslint-disable import/no-mutable-exports */
import { Knex } from 'knex';

export let DBx: Knex<any | unknown> | undefined = undefined;
export function setDBx(db: Knex<any | unknown>) {
  DBx = db;
}

export let authDB: PouchDB.Database<any> | undefined = undefined;
export function setAuthDb(db: PouchDB.Database<any>) {
  authDB = db;
}
