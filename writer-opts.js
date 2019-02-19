/**
 * @file write-opts
 * @author Cuttle Cong
 * @date 2018/8/27
 * @description
 */

const compareFunc = require(`compare-func`)
const osLocale = require(`os-locale`)
const semverValid = require(`semver`).valid
const Q = require(`q`)
const u = require(`url`)
const urlJoin = require(`url-join`)
const get = require(`lodash.get`)
const { normalizeIcafeByPkg } = require(`normalize-icafe-pkg`)
const readFile = Q.denodeify(require(`fs`).readFile)
const resolve = require(`path`).resolve
const { sync } = require(`conventional-commits-parser`)
const stripCommitMessage = require(`./stripCommitMessage`)

const parserOpts = require(`./parser-opts`)
const { i18n: i, setLanguage, extendDictionary } = require(`./i18n`)
const { name } = require(`./package`)

function stripPort(url) {
  let obj = u.parse(url)
  obj.host = obj.hostname
  let outUrl = u.format(obj)
  return !url.endsWith('/') ? outUrl.replace(/\/$/, '') : outUrl
}

function preAppendUniqPathname(url, pathname) {
  let obj = u.parse(url)
  if (!obj.pathname.slice(1).startsWith(pathname.replace(/^\//, ''))) {
    obj.pathname = urlJoin(pathname, obj.pathname)
  }
  let outUrl = u.format(obj)
  return outUrl.endsWith('/') ? outUrl.slice(0, -1) : outUrl
}

module.exports = Q.all([
  readFile(resolve(__dirname, `./templates/template.hbs`), `utf-8`),
  readFile(resolve(__dirname, `./templates/header.hbs`), `utf-8`),
  readFile(resolve(__dirname, `./templates/commit.hbs`), `utf-8`),
  readFile(resolve(__dirname, `./templates/footer.hbs`), `utf-8`)
]).spread((template, header, commit, footer) => {
  const writerOpts = getWriterOpts()

  writerOpts.mainTemplate = template
  writerOpts.headerPartial = header
  writerOpts.commitPartial = commit
  writerOpts.footerPartial = footer

  return writerOpts
})

let isContextTransformed = false
function transformContext(context) {
  context.isIcode = !!context.host && u.parse(context.host).hostname === 'icode.baidu.com'
  context.isBaiduGitLab = !!context.host && u.parse(context.host).hostname === 'gitlab.baidu.com'
  if (!context.isIcode && !context.isBaiduGitLab) {
    return context
  }
  // $port/be-fe -> be-fe
  if (context.isBaiduGitLab && context.owner) {
    context.owner = context.owner
      .split('/')
      .slice(-1)
      .join('')
  }

  if (typeof context.host === 'string') {
    context.host = stripPort(context.host)
    if (context.isIcode) {
      context.originHost = context.host
      context.host = preAppendUniqPathname(context.host, '/repos')
    }
  }
  if (typeof context.repoUrl === 'string') {
    context.repoUrl = stripPort(context.repoUrl)
    if (context.isIcode) {
      context.repoUrl = preAppendUniqPathname(context.repoUrl, '/repos')
    }
  }

  if (typeof context.repository === 'string') {
    context.repository = stripPort(context.repository)
  }
  if (context.repository && typeof context.repository.url === 'string') {
    context.repository.url = stripPort(context.repository.url)
  }

  return context
}

const osLang = (osLocale.sync() || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'

const transform = (commit, context) => {
  let pkg = context.packageData || {}
  let lang = pkg.lang || pkg.language || osLang
  setLanguage(lang)

  if (!context._isContextTransformed) {
    context._isContextTransformed = true
    transformContext(context)
    extendDictionary(get(pkg, ['config', name, 'i18n'], {}))
  }

  const i18n = (context.i18n = context.i18n || {})
  i18n.close = i('close')

  const icafe = normalizeIcafeByPkg(pkg) || {}
  const icafeID = icafe.spaceId

  let isIcode = context.isIcode
  let isBaiduGitLab = context.isBaiduGitLab
  let maybeIcafe = (isIcode || isBaiduGitLab) && !!icafeID
  const url = context.repository ? `${context.host}/${context.owner}/${context.repository}` : context.repoUrl
  if (isIcode) {
    i18n.close = i('close.icode')
    context.compare = 'merge'
  } else {
    context.compare = 'compare'
  }

  const _issue = (issue, { icafeID: innerIcafeID } = {}) => {
    innerIcafeID = innerIcafeID || icafeID
    let issueURLPrefix = `${url}/issues/`
    if (maybeIcafe) {
      issueURLPrefix = `http://newicafe.baidu.com/issue/${innerIcafeID + '-'}`
    }
    return maybeIcafe ? `${issueURLPrefix}${issue}/show` : `${issueURLPrefix}${issue}`
  }

  let discard = true
  commit.notes.forEach(note => {
    note.title = i('break-change.title')
    if (typeof note.text === 'string') {
      note.text = stripCommitMessage(note.text)
    }
    discard = false
  })

  // /^(\w*)(?:\((.*)\))?: (.*)$/
  // console.log(commit)
  commit.type = typeof commit.type === 'string' ? commit.type.toLowerCase() : commit.type

  // 允许
  // Revert "title"\n\n This reverts commit xxxx.
  // revert: title\n\n This reverts commit xxxx.
  if (commit.revert) {
    commit.revert.header = commit.revert.header || commit.revert.headerFallback
    commit.revert.hash = commit.revert.hash || commit.revert.hashFallback
  }
  if (commit.revert && !commit.type) {
    commit.type = 'revert'
    commit.subject = commit.subject || commit.revert.header
  }

  if (commit.type === `feat`) {
    commit.type = i('feat.title')
  } else if (commit.type === `fix`) {
    commit.type = i('fix.title')
  } else if (commit.type === `perf`) {
    commit.type = i('perf.title')
  } else if (commit.type === `revert`) {
    commit.type = i('revert.title')
  } else if (discard) {
    return
  } else if (commit.type === `docs`) {
    commit.type = i('docs.title')
  } else if (commit.type === `style`) {
    commit.type = i('style.title')
  } else if (commit.type === `refactor`) {
    commit.type = i('refactor.title')
  } else if (commit.type === `test`) {
    commit.type = i('test.title')
  } else if (commit.type === `build`) {
    commit.type = i('build.title')
  } else if (commit.type === `ci`) {
    commit.type = i('ci.title')
  } else if (commit.type === `temp`) {
    commit.type = i('temp.title')
  } else if (commit.type === `chore`) {
    commit.type = i('chore.title')
  }

  if (commit.scope === `*`) {
    commit.scope = ``
  }

  if (typeof commit.hash === `string`) {
    commit.hash = commit.hash.substring(0, 7)
  }

  if (commit.subject && typeof commit.subject === `string` && context.linkReferences) {
    if (url) {
      // Issue URLs.
      commit.subject = commit.subject.replace(
        new RegExp(`(${parserOpts.issuePrefixes.join('|')})([0-9]+)`, 'g'),
        (_, prefix, issue) => {
          return `[${prefix}${issue}](${_issue(issue, { icafeID: prefix !== '#' ? prefix.slice(0, -1) : '' })})`
        }
      )
    }

    if (context.host) {
      // User URLs.
      const prefix = isIcode ? context.originHost + '/users' : context.host
      commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g, `[@$1](${prefix}/$1)`)
    }
  }

  // 已经设置了只允许 parse 关闭、fix 卡片的 action
  commit.references = commit.references.filter(ref => !!ref.action).map(ref => {
    if (ref.prefix !== '#') {
      // 'du-abc-' -> 'du-abc'
      let myId = ref.prefix.slice(0, -1).toLowerCase()
      ref.issueURL = _issue(ref.issue, { icafeID: myId })
      if (maybeIcafe && myId !== icafeID) {
        ref.repository = myId
      }
    } else {
      ref.issueURL = _issue(ref.issue, { icafeID })
    }
    return ref
  })

  return commit
}

function getWriterOpts() {
  return {
    generateOn: (commit, commits, context) => {
      let hasTypeInBody = false
      let hasTypeInHeader = false

      // filter
      for (let j = 0; j < commits.length; j++) {
        if (!commits[j]) {
          commits.splice(j, 1)
        }
      }

      const pushCommit = line => {
        if (!line) return false
        const obj = sync(line, parserOpts)
        if (!obj.type) return false
        const newCommit = Object.assign({}, commit, obj)
        commits.push(transform(newCommit, context))
        return true
      }

      // 支持一个提交 多个 type
      if (commit.body) {
        // fix: aaa\nfeat: bbb
        const lines = commit.body.split('\n')
        lines.every(line => {
          if (!line.trim()) return

          if (pushCommit(line)) {
            hasTypeInBody = true
            return true
          }
        })
      }

      // 支持一个提交 多个 type
      // fix: aaa & feat: bbb & fix: ccc
      if (commit.header) {
        const unitRgxString = '(\\w*)(?:\\((.*)\\))?: (.*?)'
        const concatString = ' & '
        const rgx = new RegExp(`^(${unitRgxString})((?:${concatString}${unitRgxString})*)$`)

        let isFirst = true
        let input = commit.header
        while (rgx.test(input)) {
          const slicedMsg = RegExp.$1
          const rest = RegExp.$5
          if (!slicedMsg) return

          // 在非第一次迭代过程中，添加 commit
          if (!isFirst) {
            pushCommit(slicedMsg)
          }

          if (rest) {
            if (isFirst) {
              pushCommit([slicedMsg, commit.body, commit.footer].join('\n\n'))
              isFirst = false
            }
            hasTypeInHeader = true
            input = rest.replace(new RegExp(`^${concatString}`), '')
            continue
          }
          break
        }
      }

      // 情况 type 在头部的情况，需要清除本次提交
      if (hasTypeInHeader) {
        // 需要异步，因为本次提交，后续才会 push 至 commits
        process.nextTick(() => {
          const index = commits.indexOf(commit)
          if (index >= 0) {
            commits.splice(index, 1)
          }
        })
      }

      return !hasTypeInBody && !hasTypeInHeader ? semverValid(commit.version) : false
    },
    transform,
    groupBy: `type`,
    commitGroupsSort: `title`,
    commitsSort: [`scope`, `subject`],
    noteGroupsSort: `title`,
    notesSort: compareFunc
  }
}
