import { FC, Fragment } from 'react';
import { Route, Switch } from 'react-router-dom';
import Footer from './components/footer';
import Header from './components/header';
import Home from './pages/home';
import NotFound from './pages/not-found';

const App: FC = () => (
  <Fragment>
    <Header />
    <Switch>
      <Route exact path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
    <Footer />
  </Fragment>
);

export default App;
