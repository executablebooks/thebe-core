const merge = require('webpack-merge').default;
const express = require('express');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {},
});
