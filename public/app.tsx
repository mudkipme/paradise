import React from "react";
import { Route, Switch } from "react-router-dom";
import Footer from "./components/common/footer";
import Header from "./components/common/header";
import Home from "./components/home";
import NotFound from "./components/not-found";

const App = () => (
    <div>
        <Header />
        <Switch>
            <Route path="/" exact component={Home} />
            <Route component={NotFound} />
        </Switch>
        <Footer />
    </div>
);

export default App;
