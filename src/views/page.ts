import serialize from "serialize-javascript";

export interface IPageData {
    html: string;
    css: string;
    stats: any;
    initialState: any;
}

export default function renderFullPage(data: IPageData) {
    return `
<!doctype html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Rauken</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="format-detection" content="telephone=no">
        <meta name="HandheldFriendly" content="True">
    </head>

    <body>
        <style id="jss-server-side">${data.css}</style>
        <div id="app">${data.html}</div>
        <script>
            window.__APOLLO_STATE__ = ${serialize(data.initialState)};
        </script>
        <script src="/build/${Array.isArray(data.stats.main) ? data.stats.main[0] : data.stats.main}"></script>
    </body>
</html>
`.trim();
}
