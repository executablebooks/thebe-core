const merge = require("webpack-merge").default;
const express = require("express");
const path = require("path");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(svg|ttf|eot|woff|woff2)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              emitFile: false,
            },
          },
        ],
      },
    ],
  },
});
