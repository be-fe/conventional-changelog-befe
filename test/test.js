var conventionalChangelogCore = require('conventional-changelog-core')
var preset = require('../')
// var preset = require('conventional-changelog-angular')
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
    gitDummyCommit('temp: temp test')
    gitDummyCommit(['ci(travis): add TravisCI pipeline', 'BREAKING CHANGE: Continuously integrated.'])
    gitDummyCommit(['feat: amazing new module', 'BREAKING CHANGE: Not backward compatible.'])
    gitDummyCommit(['fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.'])
    gitDummyCommit(['perf(ngOptions): make it faster', ' closes #1, #2'])
    gitDummyCommit('revert(ngOptions): bad commit')
    gitDummyCommit('fix(*): oops')
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
    gitDummyCommit('feat(你好): some more features')
    gitDummyCommit('feat(你好): 你好')
    gitDummyCommit('feat(你 好): 你 好')
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
  },
  // 10
  function() {
    shell.exec('git tag v1.0.1')
    gitDummyCommit(['Revert: title a\n', 'This reverts commit 123.'])
    gitDummyCommit([
      'revert \\"chore: saveq\\"\n' + '\n' + 'This reverts commit 05699d0ded15dc35a038612a38185aa71274151d.'
    ])
    gitDummyCommit(['revert: title aa\n', 'This reverts commit bbaa.'])
    gitDummyCommit(['fix: title aa'])
  },

  // 11
  function() {
    gitDummyCommit(['fix: lalal', ' closes -1 i-2 i-b-3'])
  },
  // 12
  function() {
    shell.exec('git tag v1.0.2')
    // gitDummyCommit(['fix: lalal & fix: asas & feat: lalala'])
    gitDummyCommit(['fix: lalala \nfix: asas @yucong02 \nfeat: lalala', 'closed #123, #222'])
    gitDummyCommit(['fix: lalal \n illegal'])
  },
  // 13
  function() {
    shell.exec('git tag v1.0.3')
    gitDummyCommit([
      'fix: nihao @yucong02 & sdsd & fix: 你好nihao & sdsd  & feat: 看看看& & asd',
      'feat: newline',
      'closed #123, #233'
    ])
    gitDummyCommit(['fix: lalal \n newline-illegal'])
    gitDummyCommit(['fix: lalal & illegal'])
    gitDummyCommit(['lalal & illegal'])
  },
  // 14: icode mentions and references
  function() {
    shell.exec('git tag v1.0.4')
    gitDummyCommit(['fix: mention dulife-hr-11 #12 icafe-10', 'closed #123, dulife-hr-111 icafe-100'])
  },
  // 15
  function() {
    shell.exec('git tag v1.1.0')
    gitDummyCommit(
      'Fix: New-Offer-Onboarding-Project-3378 [Bug]\n' +
        '    \n' +
        '    校招职位的查看页面修改 工作职责和职位要求的顺序\n'
    )
  },
  // 16
  function() {
    shell.exec('git tag v1.1.1')
    gitDummyCommit(['chore: nothing', 'BREAKING CHANGE: breaking!!!'])
  }
])

describe('befe preset', function() {
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

          expect(chunk).to.include('持续集成')
          expect(chunk).to.include('构建')
          expect(chunk).to.include('文档')
          expect(chunk).to.include('样式')
          expect(chunk).to.include('代码重构')
          expect(chunk).to.include('测试')

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

            expect(chunk).to.include('**你 好:** 你 好')
            expect(chunk).to.include('**你好:** some more features')
            expect(chunk).to.include('**你好:** 你好')
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
            ', closes [#10](https://github.internal.example.com/conventional-changelog/internal/issues/10)'
          )

          done()
        })
      )
  })

  it('should support non public GitHub repository locations when linkReferences disabled', function(done) {
    preparing(7)

    conventionalChangelogCore(
      {
        config: preset,
        pkg: {
          path: path.join(__dirname, 'fixtures/_ghe-host.json')
        }
      },
      {
        linkReferences: false
      }
    )
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()

          expect(chunk).not.to.include('(https://github.internal.example.com/dlmr')
          expect(chunk).to.include('@dlmr')
          expect(chunk).to.include('(https://github.internal.example.com/conventional-changelog/internal/compare')

          expect(chunk).not.to.include('](https://github.internal.example.com/conventional-changelog/internal/commit/')
          expect(chunk).not.to.include(
            '5](https://github.internal.example.com/conventional-changelog/internal/issues/5'
          )
          done()
        })
      )
  })

  it('should support non public GitHub repository locations on zh', function(done) {
    preparing(7)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_ghe-zh-host.json')
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
            ', 关闭 [#10](https://github.internal.example.com/conventional-changelog/internal/issues/10)'
          )

          done()
        })
      )
  })

  it('should support Icode repository on zh', function(done) {
    preparing(7)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_icode-zh-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.include(', 关闭卡片: [#10](http://newicafe')
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
          expect(chunk).to.include('(http://newicafe.baidu.com/issue/dulife-hr-10/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issue/dulife-hr-5/')

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

          expect(chunk).to.include('(http://newicafe.baidu.com/issue/dulife-hr-11/show')
          expect(chunk).to.not.include('(http://newicafe.baidu.com/issue/dulife-hr-13/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issue/du-abc-13/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issue/dulife-hr-12/show')
          expect(chunk).to.include('(http://newicafe.baidu.com/issue/dulife-hr-5/show')

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

  it('should skip link when with not host', function(done) {
    preparing(9)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_without-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).not.to.include('http')
          done()
        })
      )
  })

  it('should used for revert', function(done) {
    preparing(10)

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.include('chore: saveq')
          expect(chunk).to.include('title a')
          expect(chunk).to.include('title aa')
          done()
        })
      )
  })

  it('should used for icafe-prefix', function(done) {
    preparing(11)

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: path.join(__dirname, 'fixtures/_icode-zh-host.json')
      }
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).not.to.include('#1')
          expect(chunk).to.include('#2')
          expect(chunk).to.include('#3')
          done()
        })
      )
  })

  it('should support `\\n` for combine multiple types', function(done) {
    preparing(12)
    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          console.log(chunk)
          expect(chunk).to.match(/### 修复\n\n\* asas \[@yucong02].+?\n\* lalal .+?\n\* lalala .+, 关闭 \[#123]/)
          expect(chunk).to.match(/### 新特性\n\n\* lalala .+?\s+$/)
          done()
        })
      )
  })

  it('should support `&` for combine multiple types', function(done) {
    preparing(13)
    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          console.log(chunk)
          expect(chunk).to.match(
            /### 修复\n\n\* lalal .+?\n\* lalal & illegal .+?\n\* nihao \[@yucong02].+ & sdsd .+\n.*\* 你好nihao & sdsd/
          )
          expect(chunk).to.match(/### 新特性[^]*newline.*\n[^]*看看看& & asd/)
          done()
        })
      )
  })

  // 14
  it('should support issue in mentions or references', function(done) {
    preparing(14)
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
          expect(chunk).to.includes('* mention [dulife-hr-11](')
          expect(chunk).to.includes('[#12]')
          expect(chunk).to.includes(
            ', closes icafe cards: [#123](http://newicafe.baidu.com/issue/dulife-hr-123/show) [#111](http://newicafe.baidu.com/issue/dulife-hr-111/show) [icafe#100](http://newicafe.baidu.com/issue/icafe-100/show)'
          )
          done()
        })
      )
  })

  // 15
  it('should support which ends with `[]`', function(done) {
    preparing(15)
    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.includes('[Bug] \\([')
          done()
        })
      )
  })

  // 16
  it('should support `chore` with `BREAKING CHANGE`', function(done) {
    preparing(16)
    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err)
      })
      .pipe(
        through(function(chunk) {
          chunk = chunk.toString()
          expect(chunk).to.includes('### 杂事')
          expect(chunk).to.includes('### 破坏性变化')
          expect(chunk).to.includes('breaking')
          expect(chunk).to.includes('nothing')
          done()
        })
      )
  })
})
