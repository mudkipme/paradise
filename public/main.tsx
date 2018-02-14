import { createMuiTheme, MuiThemeProvider } from "material-ui/styles";
import React from "react";
import { hydrate } from "react-dom";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./app";
import store from "./store";

class Main extends React.Component {
    public componentDidMount() {
        const jssStyles = document.getElementById("jss-server-side");
        if (jssStyles && jssStyles.parentNode) {
            jssStyles.parentNode.removeChild(jssStyles);
        }
    }

    public render() {
        return (
            <App />
        );
    }
}

const theme = createMuiTheme();

hydrate((
    <MuiThemeProvider theme={theme}>
        <ReduxProvider store={store}>
            <Router>
                <Main />
            </Router>
        </ReduxProvider>
    </MuiThemeProvider>
), document.getElementById("app"));
