var path = require('path'),
    webpack = require('webpack');

// var DEBUG = !process.argv.includes('--release');
// var VERBOSE = process.argv.includes('--verbose');

module.exports = {
    devtool: "source-map",
    devServer: {
        contentBase: path.resolve(__dirname, "dist"),
        port: 8000
    },
    entry: {
        app: "./src/js/index.js"
    },
    output: {
        path: path.resolve(__dirname, "dist/js"),
        filename: '[name].bundle.js',
        sourceMapFilename: "[name].bundle.js.map",
        publicPath: "http://localhost:8000/js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|libs)/,
                loader: 'babel', // 'babel-loader' is also a valid name to reference
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};