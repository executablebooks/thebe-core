const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { DefinePlugin } = require("webpack");

module.exports = {
  optimization: {
    usedExports: true,
  },
  entry: {
    app: "./src/thebe/index.ts",
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "thebe-core",
      template: "demo/index.html",
    }),
    new HtmlWebpackPlugin({
      filename: "basic-observe.html",
      title: "thebe-core-basic",
      template: "demo/demo-basic-observe.html",
    }),
    new HtmlWebpackPlugin({
      filename: "local.html",
      title: "thebe-core-ipywidgets-local",
      template: "demo/local.html",
    }),
    new HtmlWebpackPlugin({
      filename: "ipywidgets.html",
      title: "thebe-core-ipywidgets",
      template: "demo/ipywidgets.html",
    }),
    new HtmlWebpackPlugin({
      filename: "ipyleaflet.html",
      title: "thebe-core-ipyleaflet",
      template: "demo/ipyleaflet.html",
    }),
    new HtmlWebpackPlugin({
      filename: "demo-single.html",
      title: "thebe-core-demo-single",
      template: "demo/demo-single.html",
    }),
    new HtmlWebpackPlugin({
      filename: "demo-kernels.html",
      title: "thebe-core-demo-kernels",
      template: "demo/demo-kernels.html",
    }),
    new DefinePlugin({ "process.env": {} }),
  ],
  output: {
    filename: "thebe-core.min.js",
    path: path.resolve(__dirname, "dist", "lib"),
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: ["file-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
