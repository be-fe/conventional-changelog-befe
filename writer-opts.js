/**
 * @file write-opts
 * @author Cuttle Cong
 * @date 2018/8/27
 * @description
 */

const compareFunc = require(`compare-func`)
const Q = require(`q`)
const u = require(`url`)
const urlJoin = require(`url-join`)
const { normalizeIcafeByPkg } = require(`@baidu/normalize-icafe-pkg`)
const readFile = Q.denodeify(require(`fs`).readFile)
const resolve = require(`path`).resolve
const { i18n: i, setLanguage } = require(`./i18n`)

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

function getWriterOpts() {
  return {
    transform: (commit, context) => {
      if (!context._isContextTransformed) {
        context._isContextTransformed = true
        transformContext(context)
      }

      let pkg = context.packageData || {}
      let lang = pkg.lang || pkg.language || 'zh'
      setLanguage(lang)
      const i18n = (context.i18n = context.i18n || {})
      i18n.close = i('close')

      const icafe = normalizeIcafeByPkg(pkg) || { spaceId: 'noknow' }
      const icafeID = icafe.spaceId

      let isIcode = context.isIcode
      let isBaiduGitLab = context.isBaiduGitLab
      let maybeIcafe = (isIcode || isBaiduGitLab) && icafeID !== 'noknow'
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
      const issues = []

      commit.notes.forEach(note => {
        note.title = i('break-change.title')
        discard = false
      })

      commit.type = typeof commit.type === 'string' ? commit.type.toLowerCase() : commit.type
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
      }

      if (commit.scope === `*`) {
        commit.scope = ``
      }

      if (typeof commit.hash === `string`) {
        commit.hash = commit.hash.substring(0, 7)
      }

      if (typeof commit.subject === `string` && context.linkReferences) {
        if (url) {
          // Issue URLs.
          commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
            issues.push(issue)
            return `[#${issue}](${_issue(issue)})`
          })
        }

        if (context.host) {
          // User URLs.
          const prefix = isIcode ? context.originHost + '/users' : context.host
          commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g, `[@$1](${prefix}/$1)`)
        }
      }

      // remove references that already appear in the subject
      commit.references = commit.references.filter(reference => {
        return issues.indexOf(reference.issue) === -1
      })
      commit.references.map(ref => {
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
    },
    groupBy: `type`,
    commitGroupsSort: `title`,
    commitsSort: [`scope`, `subject`],
    noteGroupsSort: `title`,
    notesSort: compareFunc
  }
}
