import AuthChannel from './auth-async';
import ItemMasterChannel from './item-master-async';
import KOT from './kot-async';
import Billing from './bill-async';
import Report from './report-async';
import Utils from './utils-async';

const InitMain = () => {
  AuthChannel();
  ItemMasterChannel();
  KOT();
  Billing();
  Report();
  Utils();
};

export default InitMain;
