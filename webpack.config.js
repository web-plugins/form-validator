/**
 * Created by admin on 2017/8/24.
 */
let path = require("path");
let webpack = require("webpack");

let HtmlWebpackPlugin = require("html-webpack-plugin");
let HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

function getPath(file) {
    return path.resolve(__dirname, file);
}

module.exports = env => {
    let isDev = env.dev

    let plugins = [
        new HtmlWebpackPlugin({
            template: getPath("./index.html"),
            inlineSource: ".(css|js)$",
            minify: {minifyCSS: true, minifyJS: true},
        }),
    ];
    if (env.build) {
        plugins.push(new HtmlWebpackInlineSourcePlugin());
    }
    return {
        entry: {
            index: getPath("./index.js")
        },
        output: {path: getPath("./dist"), filename: "[name].js"},
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: "babel-loader?presets=env"
                },
            ]
        },
        externals: {
            jquery: "window.jQuery",
        },
        plugins
    };
};
