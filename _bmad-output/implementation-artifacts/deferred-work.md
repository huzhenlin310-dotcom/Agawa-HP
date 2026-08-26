- source_spec: none
  summary: 优化网站的 SEO 与搜索发现能力
  evidence: SEO 元数据、结构化数据和站点地图可独立实现、测试与发布，不是性能优化的必要依赖。
- source_spec: none
  summary: 优化网站的可访问性与键盘使用体验
  evidence: 焦点状态、语义结构和对比度改进可独立审查与回滚，与本轮性能目标相互独立。
- source_spec: none
  summary: 优化网站的响应式布局与视觉细节
  evidence: 移动端导航、长标题和版面调整属于独立的用户界面交付，混入性能改动会增加审查风险。
- source_spec: `spec-website-performance-optimization.md`
  summary: 为用户主动语言切换失败增加明确的错误反馈
  evidence: 现有点击处理从未显式捕获并展示语言 JSON 拒绝错误；本轮只保证页面可读与切换状态可恢复。
- source_spec: `spec-website-performance-optimization.md`
  summary: 在语言内容改变文档高度后主动刷新阅读进度
  evidence: 当前与基线实现都只在初始化、滚动或缩放时刷新进度，切换不同长度语言内容后可能短暂保留旧比例。
- source_spec: `spec-website-performance-optimization.md`
  summary: 建立响应式图片与加载优先级的自动化浏览器回归检查
  evidence: 本轮已用本地浏览器验证 currentSrc、断点和优先级，但仓库没有持久化浏览器测试基础设施。
- source_spec: `spec-website-performance-optimization.md`
  summary: 建立 JSON 失败与语言切换降级的自动化浏览器回归检查
  evidence: 本轮运行了 JSON 阻断和成功切换检查，但现有 CI 只部署静态文件，未自动执行该失败路径。
- source_spec: `spec-website-performance-optimization.md`
  summary: 建立阅读进度 rAF 合帧与 transform-only 更新的自动化检查
  evidence: 本轮通过浏览器与静态检查验证行为，但仓库没有可控制 requestAnimationFrame 的自动化测试环境。
