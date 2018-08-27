var conventionalChangelogCore = require('conventional-changelog-core')
var preset = require('../')
var expect = require('chai').expect
var mocha = require('mocha')
var describe = mocha.describe
var it = mocha.it
var gitDummyCommit = require('git-dummy-commit')
var shell = require('shelljs')
var through = require('through2')
var path = require('path')
var betterThanBefore = require('better-than-before')()
var preparing = betterThanBefore.preparing

betterThanBefore.setups([
  function() {
    shell.config.silent = true
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.cd('tmp')
    shell.mkdir('git-templates')
    shell.exec('git init --template=./git-templates')

    gitDummyCommit(['build: first build setup', 'BREAKING CHANGE: New build system.'])
    gitDummyCommit(['ci(travis): add TravisCI pipeline', 'BREAKING CHANGE: Continuously integrated.'])
    gitDummyCommit(['feat: amazing new module', 'BREAKING CHANGE: Not backward compatible.'])
    gitDummyCommit(['fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['perf(ngOptions): make it faster', ' closes #1, #2'])
    gitDummyCommit('revert(ngOptions): bad commit')
    gitDummyCommit('fix(*): oops ')
  },
  function() {
    gitDummyCommit(['feat(awesome): addresses the issue brought up in #133'])
  },
  function() {
    gitDummyCommit(['feat(awesome): fix #88'])
  },
  function() {
    gitDummyCommit(['feat(awesome): issue brought up by @bcoe! on Friday'])
  },
  function() {
    gitDummyCommit(['build(npm): edit build script', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['ci(travis): setup travis', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['docs(readme): make it clear', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['style(whitespace): make it easier to read', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['refactor(code): change a lot of code', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['test(*): more tests', 'BREAKING CHANGE: The Change is huge.'])
  },
  function() {
    shell.exec('git tag v1.0.0')
    gitDummyCommit('feat: some more features')
  },
  function() {
    gitDummyCommit(['feat(*): implementing #5 by @dlmr', ' closes #10'])
  },
  // 8
  function() {
    gitDummyCommit(['fix: use npm@5 (@username)'])
  },
  function() {
    gitDummyCommit(['Fix: use #5', ' closes #11,#12,du-abc-13'])
  }
])

describe('angular preset', function() {
  it('should replace @username with gitlab user URL', function(done) {
    preparing(4)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.include('[@bcoe](http://gitlab.baidu.com/bcoe)')
          done()
        })
      )
  })

  it('should not discard commit if there is BREAKING CHANGE', function(done) {
    preparing(5)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).to.include('Continuous Integration')
          expect(chunk).to.include('Build System')
          expect(chunk).to.include('Documentation')
          expect(chunk).to.include('Styles')
          expect(chunk).to.include('Code Refactoring')
          expect(chunk).to.include('Tests')

          done()
        })
      )
  })

  it('should work if there is a semver tag', function(done) {
    preparing(6)
    var i = 0

    conventionalChangelogCore({
      config: preset,
      outputUnreleased: true
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(
          function(chunk, enc, cb) {
            chunk = chunk.toString()

            expect(chunk).to.include('some more features')
            expect(chunk).to.not.include('BREAKING')

            i++
            cb()
          },
          function() {
            expect(i).to.equal(1)
            done()
          }
        )
      )
  })

  it('should work with unknown host', function(done) {
    preparing(6)
    var i = 0

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_unknown-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(
          function(chunk, enc, cb) {
            chunk = chunk.toString()

            expect(chunk).to.include('(http://unknown/compare')
            expect(chunk).to.include('](http://unknown/commits/')

            i++
            cb()
          },
          function() {
            expect(i).to.equal(1)
            done()
          }
        )
      )
  })

  it('should work specifying where to find a package.json using conventional-changelog-core', function(done) {
    preparing(7)
    var i = 0

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_known-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(
          function(chunk, enc, cb) {
            chunk = chunk.toString()

            expect(chunk).to.include('(https://github.com/conventional-changelog/example/compare')
            expect(chunk).to.include('](https://github.com/conventional-changelog/example/commit/')
            expect(chunk).to.include('](https://github.com/conventional-changelog/example/issues/')

            i++
            cb()
          },
          function() {
            expect(i).to.equal(1)
            done()
          }
        )
      )
  })

  it('should support non public GitHub repository locations', function(done) {
    preparing(7)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_ghe-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).to.include('(https://github.internal.example.com/dlmr')
          expect(chunk).to.include('(https://github.internal.example.com/conventional-changelog/internal/compare')
          expect(chunk).to.include('](https://github.internal.example.com/conventional-changelog/internal/commit/')
          expect(chunk).to.include('5](https://github.internal.example.com/conventional-changelog/internal/issues/5')
          expect(chunk).to.include(
            ' closes [#10](https://github.internal.example.com/conventional-changelog/internal/issues/10)'
          )

          done()
        })
      )
  })

  it('should only replace with link to user if it is an username', function(done) {
    preparing(8)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_github-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).to.not.include('(https://github.com/5')
          expect(chunk).to.include('(https://github.com/username')

          done()
        })
      )
  })

  it('should only replace with link to user if it is an username on icode', function(done) {
    // preparing(8)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_icode-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).to.not.include('(http://icode.baidu.com/users/5')
          expect(chunk).to.include('(http://icode.baidu.com/users/username')
          expect(chunk).to.include('(http://icode.baidu.com/repos/baidu/dulife/dulife-pc/commits/')
          expect(chunk).to.include('(http://newicafe.baidu.com/issues/dulife-hr-10/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issues/dulife-hr-5/')

          done()
        })
      )
  })

  it('should replace issue on icode and icafe', function(done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_icode-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).to.include('(http://newicafe.baidu.com/issues/dulife-hr-11/show')
          expect(chunk).to.not.include('(http://newicafe.baidu.com/issues/dulife-hr-13/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issues/du-abc-13/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issues/dulife-hr-12/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issues/dulife-hr-5/show')

          done()
        })
      )
  })

  it("should compare's link generate on icode", function(done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_icode-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.include('(http://icode.baidu.com/repos/baidu/dulife/dulife-pc/merge/v1.0.0...')
          expect(chunk).to.include('](http://icode.baidu.com/repos/baidu/dulife/dulife-pc/commits/')

          done()
        })
      )
  })
})
