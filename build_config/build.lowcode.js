const path = require('path');

module.exports = {
  alias: {
    '@': path.resolve(__dirname, '../src')
  },
  plugins: [
    [
      '@alifd/build-plugin-lowcode',
      {
        library: 'RichMaterials',
        engineScope: "@alilc",
        noParse: process.env.NODE_ENV === 'production'
      },
    ],
    path.resolve(__dirname, './build.base.plugin.js'),
    path.resolve(__dirname, './build.semi.plugin.js')
  ],
};
