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
const readFile = Q.denodeify(require(`fs`).readFile)
const resolve = require(`path`).resolve

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

console.log('context', context)

function getWriterOpts() {
  return {
    transform: (commit, context) => {
      if (!context._isContextTransformed) {
        context._isContextTransformed = true
        transformContext(context)
      }

      let pkg = context.packageData || {}
      let icafeID =
        pkg['icafe'] ||
        pkg['newicafe'] ||
        (pkg['conventional-changelog'] && pkg['conventional-changelog'].icafe) ||
        (pkg['conventional-changelog-befe'] && pkg['conventional-changelog-befe'].icafe) ||
        'noknow'

      let isIcode = context.isIcode
      const url = context.repository ? `${context.host}/${context.owner}/${context.repository}` : context.repoUrl
      if (isIcode) {
        context.compare = 'merge'
      } else {
        context.compare = 'compare'
      }

      const _issue = (issue, { icafeID: innerIcafeID } = {}) => {
        innerIcafeID = innerIcafeID || icafeID
        let issueURLPrefix = `${url}/issues/`
        if (isIcode) {
          issueURLPrefix = `http://newicafe.baidu.com/issues/${innerIcafeID + '-'}`
        }
        return isIcode ? `${issueURLPrefix}${issue}/show` : `${issueURLPrefix}${issue}`
      }

      let discard = true
      const issues = []

      commit.notes.forEach(note => {
        note.title = `BREAKING CHANGES`
        discard = false
      })

      if (commit.type === `feat`) {
        commit.type = `Features`
      } else if (commit.type === `fix`) {
        commit.type = `Bug Fixes`
      } else if (commit.type === `perf`) {
        commit.type = `Performance Improvements`
      } else if (commit.type === `revert`) {
        commit.type = `Reverts`
      } else if (discard) {
        return
      } else if (commit.type === `docs`) {
        commit.type = `Documentation`
      } else if (commit.type === `style`) {
        commit.type = `Styles`
      } else if (commit.type === `refactor`) {
        commit.type = `Code Refactoring`
      } else if (commit.type === `test`) {
        commit.type = `Tests`
      } else if (commit.type === `build`) {
        commit.type = `Build System`
      } else if (commit.type === `ci`) {
        commit.type = `Continuous Integration`
      }

      if (commit.scope === `*`) {
        commit.scope = ``
      }

      if (typeof commit.hash === `string`) {
        commit.hash = commit.hash.substring(0, 7)
      }

      if (typeof commit.subject === `string`) {
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
          ref.issueURL = _issue(ref.issue, { icafeID: ref.prefix.slice(0, -1) })
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
