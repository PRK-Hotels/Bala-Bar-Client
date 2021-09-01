import * as aws4 from 'aws4';
import ElectronStore from 'electron-store';

const store = new ElectronStore();

const ACCESS_KEY = store.get('AuthAccessKey');
const SECRET_KEY = store.get('AuthSecretKey');

export const signGetRequest = (path: string) => {
  const opts = {
    host: 'hotel.bigbeartech.in',
    method: 'GET',
    path,
    region: 'us-east-1',
    service: 'execute-api',
  };

  const { headers } = aws4.sign(opts, {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  });

  delete headers.Host;
  return headers;
};

export const signPostRequest = (
  path: string,
  body: string,
  contentType: string
) => {
  const opts = {
    host: 'hotel.bigbeartech.in',
    method: 'POST',
    path,
    region: 'us-east-1',
    service: 'execute-api',
    body,
    headers: {
      'Content-Type': contentType,
    },
  };

  const { headers } = aws4.sign(opts, {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  });

  delete headers.Host;
  return headers;
};
