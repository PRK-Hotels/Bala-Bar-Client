import React, { useState } from 'react';

import Login from './Login';
import NavBar from './NavBar';
import { ReportInfo } from '../../shared/models';

import logo from '../../assets/logo-white.svg';
import './App.global.css';

declare global {
  interface Window {
    electron: any;
  }
}

const { ipcRenderer } = window.electron;

function Content({
  isAuthorized,
  onSubmit,
  reportInfo,
  reportUpdater,
}: AuthProps) {
  const isLoggedIn = isAuthorized || false;
  const onSubmitHandler = onSubmit;

  if (isLoggedIn && reportInfo) {
    return <NavBar reportInfo={reportInfo} reportUpdater={reportUpdater} />;
  }

  return <Login onSubmit={onSubmitHandler} />;
}

const App: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [reportInfo, setReportInfo] =
    useState<ReportInfo | undefined>(undefined);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p className="App-title">Hotel Bala Regency</p>
      </header>
      <Content
        isAuthorized={authorized}
        reportInfo={reportInfo}
        reportUpdater={setReportInfo}
        onSubmit={(password) => {
          if (password.length === 6 && ipcRenderer) {
            ipcRenderer
              .invoke('report_fetch_ref')
              .then(
                (res: { err: null | string; report: null | ReportInfo }) => {
                  if (res.report) {
                    setReportInfo(res.report);
                  } else if (res.err) {
                    alert(res.err);
                  } else {
                    console.log('Unknown Error');
                  }
                  return '';
                }
              )
              .catch((err: unknown) => {
                console.log(err);
              });

            ipcRenderer
              .invoke('authenticate', password)
              .then((res: any) => {
                console.log('Res: ', res);
                setAuthorized(res.loggedIn);
                if (res.err) {
                  alert(res.err);
                }
                return '';
              })
              .catch((err: unknown) => {
                console.log(err);
              });
          }
        }}
      />
    </div>
  );
};

type AuthProps = {
  isAuthorized: boolean;
  reportInfo: ReportInfo | undefined;
  reportUpdater: React.Dispatch<React.SetStateAction<ReportInfo | undefined>>;
  onSubmit: (a: string) => void;
};

export default App;
