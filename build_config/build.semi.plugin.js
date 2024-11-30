const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SemiV2WebpackPlugin = require('@douyinfe/semi-webpack-plugin').default;
const path = require('path');

module.exports = ({ context, onGetWebpackConfig, modifyUserConfig }) => {
  onGetWebpackConfig((config) => {
    config
      .plugin('SemiV2WebpackPlugin')
      .use(SemiV2WebpackPlugin, [
        {
          prefixCls: 'semi-v2',
          extractCssOptions: {
            loader: MiniCssExtractPlugin.loader

          }
        }
      ])

    config.module
      .rule('jsx')
      .exclude
        .clear()

    config.module
      .rule('tsx')
      .exclude
      .clear()
  });
}
