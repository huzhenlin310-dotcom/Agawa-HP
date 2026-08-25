param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^blog-[a-z0-9]+(?:-[a-z0-9]+)*$')]
  [string]$Stem
)

$ErrorActionPreference = 'Stop'

$skillDir = Split-Path -Parent $PSScriptRoot
$skillsDir = Split-Path -Parent $skillDir
$agentsDir = Split-Path -Parent $skillsDir
$projectRoot = Split-Path -Parent $agentsDir

$editions = @(
  @{ Lang = 'zh'; Page = "$Stem.html"; Data = 'assets/data/site.zh.json' },
  @{ Lang = 'en'; Page = "$Stem-en.html"; Data = 'assets/data/site.en.json' },
  @{ Lang = 'ja'; Page = "$Stem-ja.html"; Data = 'assets/data/site.ja.json' }
)

$sectionCounts = @()

foreach ($edition in $editions) {
  $pagePath = Join-Path $projectRoot $edition.Page
  if (-not (Test-Path -LiteralPath $pagePath)) {
    throw "Missing article page: $($edition.Page)"
  }

  $html = Get-Content -Raw -LiteralPath $pagePath
  $htmlLang = [regex]::Match($html, '<html\s+lang="([^"]+)"').Groups[1].Value
  $articleLang = [regex]::Match($html, 'data-article-lang="([^"]+)"').Groups[1].Value

  if ($htmlLang -ne $edition.Lang -or $articleLang -ne $edition.Lang) {
    throw "Language metadata mismatch in $($edition.Page)"
  }

  foreach ($requiredPattern in @('<title>', '<h1>', 'class="article-body"', 'class="article-hero-figure"')) {
    if ($html -notmatch $requiredPattern) {
      throw "Missing required article markup '$requiredPattern' in $($edition.Page)"
    }
  }

  if ($html -match '<button[^>]+data-lang[^>]+disabled') {
    throw "Disabled language switch found in $($edition.Page)"
  }

  $targets = [regex]::Matches($html, 'data-lang-target="([^"]+)"')
  if ($targets.Count -ne 2) {
    throw "Expected two language targets in $($edition.Page), found $($targets.Count)"
  }

  foreach ($target in $targets) {
    $targetPath = Join-Path $projectRoot $target.Groups[1].Value
    if (-not (Test-Path -LiteralPath $targetPath)) {
      throw "Missing language target '$($target.Groups[1].Value)' in $($edition.Page)"
    }
  }

  $imageSrc = [regex]::Match($html, '<figure\s+class="article-hero-figure"[\s\S]*?<img\s+[^>]*src="([^"]+)"').Groups[1].Value
  if (-not $imageSrc) {
    throw "Missing article hero image in $($edition.Page)"
  }
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $imageSrc))) {
    throw "Missing hero image asset '$imageSrc' in $($edition.Page)"
  }

  $sectionCounts += [regex]::Matches($html, '<section(?:\s|>)').Count

  $dataPath = Join-Path $projectRoot $edition.Data
  $siteData = Get-Content -Raw -LiteralPath $dataPath | ConvertFrom-Json
  $post = $siteData.blog.posts | Where-Object { $_.url -eq $edition.Page }
  if (-not $post) {
    throw "Article is not indexed in $($edition.Data): $($edition.Page)"
  }
}

if (($sectionCounts | Select-Object -Unique).Count -ne 1) {
  throw "The three editions do not have matching section counts: $($sectionCounts -join ', ')"
}

Push-Location $projectRoot
try {
  & node --check 'assets/js/main.js'
  if ($LASTEXITCODE -ne 0) {
    throw 'JavaScript syntax validation failed.'
  }

  & git diff --check
  if ($LASTEXITCODE -ne 0) {
    throw 'git diff --check failed.'
  }
}
finally {
  Pop-Location
}

Write-Output "OK: validated zh/en/ja pages, reciprocal language links, hero image, JSON indexes, JavaScript, and Git diff for '$Stem'."
