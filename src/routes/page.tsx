import fs from "fs";
import { create } from "jss";
import preset from "jss-preset-default";
import { Context } from "koa";
import { createGenerateClassName, createMuiTheme, MuiThemeProvider } from "material-ui/styles";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { SheetsRegistry } from "react-jss/lib/jss";
import JssProvider from "react-jss/lib/JssProvider";
import { Provider as ReduxProvider } from "react-redux";
import { StaticRouter } from "react-router-dom";
import App from "../../public/app";
import { IRouterContext } from "../../public/interfaces/app-interface";
import { create as createStore } from "../../public/store";
import renderFullPage from "../views/page";

const stats = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/stats.generated.json"), "utf8"));

export default async function(ctx: Context, next: () => Promise<void>) {
    await next();
    if (ctx.status !== 404) {
        return;
    }

    const sheetsRegistry = new SheetsRegistry();
    const theme = createMuiTheme();
    const jss = create(preset());
    const generateClassName = createGenerateClassName();
    const context: IRouterContext = {};
    const store = createStore();

    const html = renderToString(
        <JssProvider registry={sheetsRegistry} jss={jss} generateClassName={generateClassName}>
            <MuiThemeProvider theme={theme} sheetsManager={new Map()}>
                <ReduxProvider store={store}>
                    <StaticRouter location={ctx.url} context={context}>
                        <App />
                    </StaticRouter>
                </ReduxProvider>
            </MuiThemeProvider>
        </JssProvider>,
    );

    if (context.notFound) {
        ctx.response.status = 404;
    }

    const css = sheetsRegistry.toString();
    ctx.response.body = renderFullPage({ html, css, stats });
}
