module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.output.publicPath('/materials/')
  });
}
