'use strict'

module.exports = {
  headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
  referenceActions: ['close', 'closes', 'closed', 'fix', 'fixes', 'fixed', 'resolve', 'resolves', 'resolved'],
  headerCorrespondence: [`type`, `scope`, `subject`],
  noteKeywords: [`BREAKING CHANGE`],
  revertPattern: /^(?:revert:\s([\s\S]*?)\s*This reverts commit (\w*)\.?)|(?:[Rr]evert\s"?([\s\S]*?)"?\s*This reverts commit (\w*)\.?)/,
  revertCorrespondence: [`header`, `hash`, `headerFallback`, 'hashFallback'],
  issuePrefixes: ['#', '[a-zA-Z0-9][a-zA-Z0-9-]*-']
}
