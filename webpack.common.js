// Webpack common configuration

/**
 * The path module provides utilities for working with file and directory paths
 */
const path = require('path');

/**
 * A webpack plugin to remove/clean your build folder(s) before building
 */
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    index: './src/js/index.js',
  },
  output: {
    filename: './[name].bundle.js',
    chunkFilename: './[name].bundle.js',
    path: path.resolve(__dirname, 'dist') // eslint-disable-line no-undef
  },
  plugins: [
    new CleanWebpackPlugin(['dist'])
  ],
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'eslint-loader',
      },
      {
        test: /\.mp3$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};