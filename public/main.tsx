import ApolloClient from "apollo-boost";
import { createMuiTheme, MuiThemeProvider } from "material-ui/styles";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { hydrate } from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./app";

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
const client = new ApolloClient({ uri: "/graphql" });
if ((window as any).__APOLLO_STATE__) {
    client.restore((window as any).__APOLLO_STATE__);
}

hydrate((
    <MuiThemeProvider theme={theme}>
        <ApolloProvider client={client}>
            <Router>
                <Main />
            </Router>
        </ApolloProvider>
    </MuiThemeProvider>
), document.getElementById("app"));
