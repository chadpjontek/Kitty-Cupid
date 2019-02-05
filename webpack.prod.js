// Webpack production configuration

/**
 * The path module provides utilities for working with file and directory paths
 */
// const path = require('path');

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
 * Copies individual files or entire directories to the build directory
 */
const CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * This plugin will search for CSS assets during the Webpack build and will optimize \ minimize the CSS
 */
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

/**
 * This plugin will minify the JS
 */
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

/**
 * A JavaScript parser, mangler/compressor and beautifier toolkit for ES6+.
 */
const UglifyES = require('uglify-es');

/**
 * Plugin that simplifies creation of HTML files to serve your bundles
 */
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * variable to hold HtmlWebpackPlugin's minify options
 */
const minify = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true,
  useShortDoctype: true
};

module.exports = merge(common, {
  mode: 'production',
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
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              // optipng.enabled: false will disable optipng
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
                strip: true
              }
            }
          },
        ]
      },
      {
        test: /\.s?css$/,
        use: [
          'style-loader', // Injects CSS into the DOM via a <style> tag
          {
            loader: 'css-loader', // The css-loader interprets @import and url() like import/require() and will resolve them.
            options: {
              sourceMap: false, // No source maps for our CSS files
              importLoaders: 1 // Number of loaders to use before this loader (i.e. postcss first)
            }
          },
          'postcss-loader' // Uses our postcss.config file to add vendor prefixes to our CSS
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'src/sw.js',
        to: '.',
        transform(content) {
          return Promise.resolve(Buffer.from(UglifyES.minify(content.toString()).code, 'utf8'));
        }
      },
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
      chunks: ['index'],
      minify
    }),
  ]
});