// Webpack development configuration

/**
 * This utility allows webpack to 'merge' configurations together.
 * To keep code DRY we can seperate common configuration and merge that into development or production.
 */
const merge = require('webpack-merge');

/**
 * My common webpack congiuration tasks
 */
const common = require('./webpack.common.js');

/**
 * This plugin will search for CSS assets during the Webpack build and will optimize \ minimize the CSS
 */
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

/**
 * This plugin will minify the JS
 */
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

/**
 * Copies individual files or entire directories to the build directory
 */
const CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * Plugin that simplifies creation of HTML files to serve your bundles
 */
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    port: 8080
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader', // Injects CSS into the DOM via a <style> tag
          {
            loader: 'css-loader', // The css-loader interprets @import and url() like import/require() and will resolve them.
            options: {
              sourceMap: true, // Includes source maps to our CSS files
              importLoaders: 1 // Number of loaders to use before this loader (i.e. postcss first)
            }
          },
          'postcss-loader' // Uses our postcss.config file to add vendor prefixes to our CSS
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'src/sw.js',
      {
        from: 'src/icons',
        to: './icons',
      },
      'src/manifest.json',
      'src/browserconfig.xml'
    ]),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      chunks: ['index']
    }),
  ]
});