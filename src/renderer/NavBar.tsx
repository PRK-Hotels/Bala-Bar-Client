import React from 'react';

import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import '../../assets/styles/bootstrap4.min.global.css';
import './NavBar.global.css';

import KOT from './KOT';
import Configure from './Configure';

import { ReportInfo } from '../../shared/models';

// Set Online/Offline event listener
// const updateOnlineStatus = () => {
//     ipcRenderer.send('online-status-changed', navigator.onLine ? 'online' : 'offline')
// }

// window.addEventListener('online', updateOnlineStatus)
// window.addEventListener('offline', updateOnlineStatus)
// updateOnlineStatus()

const GetNavBar = (transactionDate: string) => {
  return (
    <Navbar bg="light" expand="sm">
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="#/kot">KOT</Nav.Link>
          <Nav.Link href="#/configure">Configure</Nav.Link>
        </Nav>
        <p className="Transaction-Date">Transaction Date: {transactionDate}</p>
      </Navbar.Collapse>
    </Navbar>
  );
};

function GetRouter(reportInfo: ReportInfo) {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/">
          <Redirect to="/kot" />
        </Route>
        <Route
          exact
          path="/kot"
          render={() => <KOT reportInfo={reportInfo} />}
        />
        <Route exact path="/configure" component={Configure} />
      </Switch>
    </HashRouter>
  );
}

const NavBar: React.FC<NavBarProps> = ({ reportInfo }: NavBarProps) => {
  return (
    <div className="App-Content">
      {GetNavBar(reportInfo.curReportDateStr)}
      {GetRouter(reportInfo)}
    </div>
  );
};

type NavBarProps = {
  reportInfo: ReportInfo;
};

export default NavBar;
