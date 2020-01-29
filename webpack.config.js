const NodeExternals = require('webpack-node-externals');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
const fs = require('fs')

const paths = {
  src: path.resolve(__dirname, 'src'),
  debug: path.resolve(__dirname, 'debug'),
  dist: path.resolve(__dirname, 'dist'),
  lib: path.resolve(__dirname, 'lib'),
  types: path.resolve(__dirname, 'lib')
};
const entryFileName = path.join(paths.src, "main.ts");
const outProductionBundleFileName = 'index.js';
const outDevBundleFileName = 'index.dev.js';


class RsnCleanBeforBuildWebpackPlugin {
  apply(compiler) {
    compiler.hooks.beforeRun.tap('RsnCleanBeforBuildWebpackPlugin', () => {
      this.remodeFolder(paths.types);
      this.remodeFolder(paths.dist);
      this.remodeFolder(paths.debug);
      this.remodeFolder(paths.lib);
    });
  }

  remodeFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, {
        recursive: true
      });
    }
  }
};

const nodeEnv = process.env.NODE_ENV || 'development';
const {
  getIfUtils
} = require('webpack-config-utils');

const {
  ifDevelopment,
  ifProduction
} = getIfUtils(nodeEnv);


let config = {
  node: {
    setImmediate: false,
    process: 'mock',
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },

  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.json', 'sass', 'css', 'vue'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  entry: entryFileName,
  output: {
    filename: ifProduction(outProductionBundleFileName, outDevBundleFileName),
    path: path.resolve(__dirname, ifProduction(paths.dist, paths.debug)),
    pathinfo: false
  },

  mode: nodeEnv,
  devtool: ifDevelopment('cheap-module-source-map', false),
  target: 'node',
  externals: [NodeExternals()],

  optimization: {
    // noEmitOnErrors: true,
    // removeAvailableModules: false,
    // removeEmptyChunks: false,
    // splitChunks: false
    usedExports: true
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/
    }]
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true
    }),
    new RsnCleanBeforBuildWebpackPlugin()
  ]
};

module.exports = config;