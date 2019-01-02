/**
 * @file stripCommitMessage
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 02/01/2019
 *
 */

function strip(message) {
  if (typeof message !== 'string') {
    throw new TypeError('Expect got string, but ' + typeof message)
  }

  return message.replace(/(\n\n)?Change-Id: [a-zA-Z0-9]{20,}$/, '')
}

module.exports = strip
