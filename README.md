# @baidu/conventional-changelog-befe

<!--[![build status](https://img.shields.io/travis/imcuttle/conventional-changelog-befe/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/conventional-changelog-befe)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/conventional-changelog-befe.svg?style=flat-square)](https://codecov.io/github/imcuttle/conventional-changelog-befe?branch=master)-->

[![NPM version](https://img.shields.io/npm/v/conventional-changelog-befe.svg?style=flat-square)](https://www.npmjs.com/package/conventional-changelog-befe)
[![NPM Downloads](https://img.shields.io/npm/dm/conventional-changelog-befe.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/conventional-changelog-befe)

conventional-changelog preset for baidu BEFE.

## 样例项目

[icode commit-demo](http://icode.baidu.com/repos/baidu/personal-code/commit-demo)

## 规范标准

- [Commit message 和 Change log 编写指南](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)
- [约定式提交](https://conventionalcommits.org/lang/zh-Hans)

除了上述规范标准以外，befe 规范还支持：

### type 允许大写字母开头

- `build/Build`: 构建相关
- `chore/Chore`: 其他繁杂事务的变动
- `ci/Ci`: ci 相关的变动
- `docs/Docs`: 文档书写改动
- `feat/Feat`: 新功能，新特性 **(体现在 changelog)**
- `fix/Fix`: Bug 修复 **(体现在 changelog)**
- `perf/Perf`: 性能优化相关 **(体现在 changelog)**
- `refactor`: 重构（即不是新增功能，也不是修改 bug 的代码变动）
- `revert/Revert`: 代码回滚 **(体现在 changelog)**
- `style/Style`: Code Style 修改
- `test/Test`: 测试相关

### scope / subject 允许中文

```text
feat(编辑页面): 添加自动保存
```

### 支持 icode / baidu gitlab / icafe

如果是 icode 或 baidu gitlab 仓库（会读取 `package.json` 中的 `repository` 或者 获取 git 远端地址），需要在 `package.json` 中配置 `icafe` 或者 `newicafe` 字段，对应为该项目的 icafe Id。

```json
{
  "icafe": "dulife-hr"
}
```

然后在 commit message 中匹配的 `#123` 将会在 changelog 对应为 icafe 对应 issue 地址。

如果是想关联其他项目的卡片，则需要在 commit message 中书写完整的 icafe ID, 如

```text
feat: 完成 changelog 文档任务

closes BEFE-ERP-225 befe-erp-564
```

### changelog 支持中英文

在 `package.json` 中配置

```json
{
  "lang": "zh" // 'zh' | 'cn'
}
```

## 使用

### 安装

```
npm i conventional-changelog-cli @baidu/conventional-changelog-befe -D --registry=http://registry.npm.baidu-int.com
```

### 在项目 (`package.json`) 配置

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p @baidu/befe -i CHANGELOG.md -s -r 0 && git add CHANGELOG.md",
    "version": "npm run changelog"
  }
}
```

### 触发

执行 `npm version [version]` 或直接执行 `npm run changelog`

## Related

- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - 根据 commit message 生成 changelog
- [commitlint](https://github.com/marionebl/commitlint) - Lint commit messages
- [@baidu/commitlint-config-befe](http://gitlab.baidu.com/be-fe/commitlint-config-befe) - commitlint lint 预设

## License

MIT
