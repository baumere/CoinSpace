'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const autoprefixer = require('autoprefixer');
const Dotenv = require('dotenv-webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const envFile = process.env.ENV_FILE ? process.env.ENV_FILE : '.env.prod';

const config = merge(common, {
  output: {
    publicPath: '/',
  },
  devtool: 'hidden-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, './node_modules/lodash/'),
          path.resolve(__dirname, './node_modules/ethjs-util/'),
          path.resolve(__dirname, './node_modules/eosjs/'),
          path.resolve(__dirname, './node_modules/js-xdr/'),
          path.resolve(__dirname, './node_modules/clipboard/'),
          path.resolve(__dirname, './node_modules/@sentry/'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [[
              'env', {
                useBuiltIns: 'entry',
              },
            ]],
            parserOpts: {
              plugins: ['dynamicImport', 'objectRestSpread'],
            },
            plugins: [
              'transform-object-rest-spread',
            ],
          },
        },
      },
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: [
                  autoprefixer,
                ],
              },
            },
            {
              loader: 'sass-loader',
            },
          ],
          fallback: 'style-loader',
          publicPath: '../../',
        }),
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['./build'], { verbose: false }),
    new ProgressBarPlugin(),
    new Dotenv({
      path: envFile,
      safe: true,
      systemvars: true,
    }),
    new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        mangle: {
          reserved: ['BigInteger', 'ECPair', 'Point', '_', 'RippleError', 'RippledError', 'UnexpectedError',
            'LedgerVersionError', 'ConnectionError', 'NotConnectedError',
            'DisconnectedError', 'TimeoutError', 'ResponseFormatError',
            'ValidationError', 'NotFoundError', 'MissingLedgerHistoryError',
            'PendingLedgerVersionError',
          ],
        },
      },
    }),
    new ExtractTextPlugin({
      filename: 'assets/css/all.[contenthash:8].css',
      allChunks: true,
    }),
  ],
});

if (process.env.BUILD_TYPE === 'phonegap') {
  const htmlPlugin = config.plugins.find((plugin) => {
    return plugin instanceof HtmlWebpackPlugin;
  });
  htmlPlugin.options.chunks = ['deviceready'];

  config.entry['deviceready'] = ['babel-polyfill', './phonegap/deviceready.js'];
  delete config.entry['loader'];

  config.output.publicPath = '';
} else if (process.env.BUILD_TYPE === 'electron') {
  config.plugins.push(new HtmlWebpackPlugin({
    inject: false,
    template: 'electron/env.ejs',
    filename: 'env.json',
  }));
  config.output.publicPath = './';
}

module.exports = config;
