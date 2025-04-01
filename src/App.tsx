import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import AppAbout from './pages/appAbout/info'; // Import the info component
import Login from './pages/userAuth/login'; // Import the Login component
import Register from './pages/userAuth/register'; // Import the Register component
import OtpPage from './pages/userAuth/otp'; // Import the OTP page
import Dashboard from './pages/userDashboard/dashboard'; // Import the Dashboard component
import Loading from './pages/appAbout/loading'; // Import the Loading component
import Deposit from './pages/userDashboard/deposit'; // Import the Deposit component
import Withdraw from './pages/userDashboard/withdraw'; // Import the Withdraw component
import Transfer from './pages/userDashboard/transfer'; // Import the Transfer component
import TransactionHistory from './pages/userDashboard/transaction'; // Import the TransactionHistory component
import Card from './pages/userDashboard/card'; // Import the Card component
import Investment from './pages/userDashboard/investment'; // Import the Investment component
import Settings from './pages/userDashboard/settings'; // Import the Settings component

/* Tailwind styles */
import './theme/tailwind.css'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/info">
          <AppAbout />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/otp">
          <OtpPage />
        </Route>
        <Route exact path="/settings">
          <Settings />
        </Route>
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/loading">
          <Loading />
        </Route>
        <Route exact path="/deposit">
          <Deposit />
        </Route>
        <Route exact path="/withdraw">
          <Withdraw />
        </Route>
        <Route exact path="/transfer">
          <Transfer />
        </Route>
        <Route exact path="/transactions">
          <TransactionHistory />
        </Route>
        <Route exact path="/card">
          <Card />
        </Route>
        <Route exact path="/investment">
          <Investment />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;