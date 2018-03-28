const CleanWebpackPlugin = require("clean-webpack-plugin");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    target: "node",
    devtool: "source-map",
    externals: [nodeExternals()],
    entry: {
        app: path.resolve(__dirname, "src", "app.ts")
    },
    output: {
        path: path.resolve(__dirname, "build"),
        publicPath: "/build/",
        filename: "[name].js",
        library: "[name]",
        libraryTarget: "commonjs2"
    },
    node: {
        __dirname: true
    },
    resolve: {
        extensions: [".ts", ".tsx", ".jsx", ".js"]
    },
    module: {
        loaders: [
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader"
            },
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: "graphql-tag/loader"
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([path.join(__dirname, "build")]),
        new webpack.BannerPlugin({
            banner: "#!/usr/bin/env node",
            raw: true
        }),
        function () {
            this.plugin("done", () => {
                fs.chmodSync("./build/app.js", "755");
            });
        },
    ]
};