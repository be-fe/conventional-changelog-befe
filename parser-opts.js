'use strict'

module.exports = {
  headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
  // headerPattern: /^([^:\s]*?)(?:\((.*)\))?: (.*)$/,
  headerCorrespondence: [`type`, `scope`, `subject`],
  noteKeywords: [`BREAKING CHANGE`],
  revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
  revertCorrespondence: [`header`, `hash`],
  issuePrefixes: ['#', '[a-zA-Z0-9-]+-']
}
