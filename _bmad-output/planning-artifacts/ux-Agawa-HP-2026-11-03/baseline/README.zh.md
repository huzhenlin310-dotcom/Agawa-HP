# 基线说明（2026-11-03）

## 为什么没有 `git diff`

仓库有 `.git`；PATH 中没有 `git`，但 GitHub Desktop 自带 git 可用：`C:\Users\阿川\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe`（2.53.0）。任务结束时用它复核过工作区状态。

替代做法：

1. `originals/` 保存任务开始时 4 个文件的逐字节副本：
   - `assets/data/site.zh.json`
   - `assets/data/site.en.json`
   - `assets/data/site.ja.json`
   - `docs/ux-optimization-execution-plan.zh.md`
2. `tree-start.sha256`：任务开始时，根目录 `*.html/*.md/*.json/*.xml/*.txt/*.py` 与 `assets/**/*.{json,js,css}` 共 33 个文件的 SHA-256。
3. `tree-end.sha256`：任务结束时同样 33 个文件的 SHA-256。
4. `Compare-Object tree-start.sha256 tree-end.sha256` 结果为空 → 生产文件未被改动。

三份语言 JSON 的用户未提交修改因此被完整保留；本任务没有 `git reset` / `checkout`，也没有改写它们。

## 任务结束时的 git 状态（用自带 git 只读复核）

```
$ "...\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe" status --short
 M assets/data/site.en.json
 M assets/data/site.ja.json
 M assets/data/site.zh.json
?? _bmad-output/planning-artifacts/
?? docs/ux-optimization-execution-plan.zh.md

HEAD: 87ff732 Rewrite October review to preserve original meaning（任务前提交）
暂存区：空
```

这说明：用户原有的三份 JSON 修改与方案文件都在；本任务只新增了 `_bmad-output/planning-artifacts/` 下的内容；没有 commit、没有 push、没有暂存。

`.git/objects` 中有一批 2026-11-03 10:53:17 写入的对象（收尾中断时交接方执行 git 操作留下），但没有新 ref、没有新提交，工作区内容不受影响。

## 如何复核

```powershell
cd "C:\Users\阿川\Documents\New project 5\Agawa-HP"

# 逐字节对比用户修改过的三份 JSON 与任务开始时的副本
Compare-Object (Get-FileHash assets/data/site.zh.json).Hash `
               (Get-FileHash _bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/baseline/originals/site.zh.json).Hash

# 重新生成当前清单并对比
Get-ChildItem -Path . -File | Where-Object { $_.Extension -in '.html','.md','.json','.xml','.txt','.py' } |
  ForEach-Object { "$((Get-FileHash $_.FullName -Algorithm SHA256).Hash)  $($_.Name)" }
```

如果之后装好 git，可以直接用 `git status --short` 复核；预期看到的仍然是用户原有的三份 JSON 修改、本任务目录（未跟踪），以及 `docs/ux-optimization-execution-plan.zh.md`。

## 注意

- 本目录在 `_bmad-output/` 下，不属于 Pages 产物，也不会被发布。
- `originals/` 只是基线副本，不是网站运行所需文件。
