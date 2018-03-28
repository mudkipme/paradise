"use strict";

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const merge = require("webpack-merge");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    context: __dirname,
    entry: [
        "./public/main.tsx"
    ],
    output: {
        path: path.join(__dirname, "public", "build"),
        filename: "main.[chunkhash].js",
        publicPath: "/"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".jsx", ".css", ".js", ".json"]
    },
    module: {
        loaders: [
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: "graphql-tag/loader"
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([path.join(__dirname, "public", "build")]),
        function () {
            this.plugin("done", function (stats) {
                if (!fs.existsSync(path.join(__dirname, "data"))) {
                    fs.mkdirSync(path.join(__dirname, "data"));
                }
                fs.writeFileSync(path.join(__dirname, "data/stats.generated.json"), JSON.stringify(stats.toJson().assetsByChunkName));
            });
        }
    ]
};

if (process.env.NODE_ENV === "production") {
    module.exports = merge(module.exports, {
        devtool: "source-map",
        plugins: [
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify("production")
            }),
            new UglifyJSPlugin({
                sourceMap: true
            })
        ]
    });
} else {
    module.exports = merge(module.exports, {
        devtool: "inline-source-map",
        plugins: [
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify("development")
            })
        ]
    });
}