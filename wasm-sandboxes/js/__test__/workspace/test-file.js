const { result: file1Result } = require('./imports/imported-file-test');
const { result: file2Result } = require('./imports/imported-file-test2');

module.exports = {
  message: 'File test',
  file1Result,
  file2Result
};
