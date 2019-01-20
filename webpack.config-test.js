var nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node", // webpack should compile node compatible code
  output: {
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  externals: [
    nodeExternals(),
    {
      lodash: {
        commonjs: "lodash",
        commonjs2: "lodash",
        amd: "_",
        root: "_"
      }
    },
    /^(lodash(.)(\S)*?)$/
  ] // in order to ignore all modules in node_modules folder
};
