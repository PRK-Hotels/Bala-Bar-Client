/* eslint-disable no-undef-init */
/* eslint-disable import/no-mutable-exports */
import { Socket } from 'socket.io';
import { Socket as ClientSocket } from 'socket.io-client';

export let IOx: Socket | ClientSocket | undefined;
export function setSocket(io: Socket | ClientSocket | undefined) {
  IOx = io;
}
