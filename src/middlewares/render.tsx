import { ApolloClient } from "apollo-boost";
import { InMemoryCache } from "apollo-cache-inmemory";
import { SchemaLink } from "apollo-link-schema";
import fs from "fs";
import { create } from "jss";
import preset from "jss-preset-default";
import { Context } from "koa";
import { createGenerateClassName, createMuiTheme, MuiThemeProvider } from "material-ui/styles";
import path from "path";
import React from "react";
import { ApolloProvider, getDataFromTree } from "react-apollo";
import { renderToString } from "react-dom/server";
import { SheetsRegistry } from "react-jss/lib/jss";
import JssProvider from "react-jss/lib/JssProvider";
import { StaticRouter } from "react-router-dom";
import App from "../../public/app";
import { IRouterContext } from "../../public/interfaces/app-interface";
import schema from "../graphql/schema";
import renderFullPage from "../views/page";

const stats = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/stats.generated.json"), "utf8"));

function createRenderer() {
    return async function(this: Context) {
        const sheetsRegistry = new SheetsRegistry();
        const theme = createMuiTheme();
        const jss = create(preset());
        const generateClassName = createGenerateClassName();
        const context: IRouterContext = {};
        const client = new ApolloClient({
            cache: new InMemoryCache(),
            link: new SchemaLink({ schema, context: this }),
            ssrMode: true,
        });

        const Main = (
            <ApolloProvider client={client}>
                <StaticRouter location={this.url} context={context}>
                    <App />
                </StaticRouter>
            </ApolloProvider>
        );

        await getDataFromTree(Main);
        const html = renderToString(
            <JssProvider registry={sheetsRegistry} jss={jss} generateClassName={generateClassName}>
                <MuiThemeProvider theme={theme} sheetsManager={new Map()}>
                    {Main}
                </MuiThemeProvider>
            </JssProvider>,
        );
        const initialState = client.extract();

        if (context.notFound) {
            this.response.status = 404;
        }

        const css = sheetsRegistry.toString();
        this.response.body = renderFullPage({ html, css, stats, initialState });
    };
}

export function middleware() {
    const renderer = createRenderer();

    return async (ctx: Context, next: () => Promise<void>) => {
        ctx.render = renderer;
        await next();
    };
}
