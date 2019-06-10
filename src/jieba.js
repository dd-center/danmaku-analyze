const nodejieba = require('nodejieba')
const { join } = require('path')
nodejieba.load({
  userDict: join(__dirname, '../resource/dictionary/userdict.txt')
})

module.exports = (string, n) => nodejieba.extract(string, n)
