const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin, NormalModuleReplacementPlugin } = require('webpack');

const shimJS = path.resolve(__dirname, 'src', 'empty.js');
function shim(regExp) {
  return new NormalModuleReplacementPlugin(regExp, shimJS);
}

module.exports = {
  optimization: {
    usedExports: true,
  },
  entry: {
    app: './src/thebe/index.ts',
  },
  plugins: [
    shim(/\.(svg|ttf|eot|woff2|woff)/),
    new HtmlWebpackPlugin({
      title: 'thebe-core',
      template: 'demo/index.html',
    }),
    new DefinePlugin({ 'process.env': {} }),
  ],
  output: {
    filename: 'thebe-core.min.js',
    path: path.resolve(__dirname, 'dist', 'lib'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /pypi\/.*/,
        type: 'asset/source',
      },
      {
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /fontawesome-free.*\.(svg|eot|ttf|woff)$/,
        loader: 'ignore-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
