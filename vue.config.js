const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/mcts_web/'
    : '/',
  outputDir: 'dist',
  assetsDir: 'storyteller',
  configureWebpack: {
    devtool: 'source-map'
  }
})
