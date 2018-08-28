/**
 * @file index
 * @author Cuttle Cong
 * @date 2018/8/28
 * @description
 */

const { createIsolateI18n } = require('tiny-i18n')

const i = createIsolateI18n()
i.setDictionary(require('./zh'), 'zh')
i.setDictionary(require('./zh'), 'zh-cn')

i.setDictionary(require('./en'), 'en')
i.setDictionary(require('./en'), 'en-us')
i.setLanguage('zh')

module.exports = i
