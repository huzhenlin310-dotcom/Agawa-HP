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
$siteHost = (Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'CNAME')).Trim()
$siteOrigin = "https://$siteHost"

$editions = @(
  @{ Lang = 'zh'; Page = "$Stem.html"; Data = 'assets/data/site.zh.json' },
  @{ Lang = 'en'; Page = "$Stem-en.html"; Data = 'assets/data/site.en.json' },
  @{ Lang = 'ja'; Page = "$Stem-ja.html"; Data = 'assets/data/site.ja.json' }
)

$pageByLang = @{
  zh = "$Stem.html"
  en = "$Stem-en.html"
  ja = "$Stem-ja.html"
  'x-default' = "$Stem.html"
}

function Get-TagAttributeValue {
  param(
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$Attribute
  )

  return [regex]::Match($Tag, "\b$([regex]::Escape($Attribute))=`"([^`"]+)`"", 'IgnoreCase').Groups[1].Value
}

function Get-MetaContent {
  param(
    [Parameter(Mandatory = $true)][string]$Html,
    [Parameter(Mandatory = $true)][ValidateSet('name', 'property')][string]$KeyAttribute,
    [Parameter(Mandatory = $true)][string]$Key
  )

  $escapedKey = [regex]::Escape($Key)
  $tag = [regex]::Match($Html, "<meta\b[^>]*\b$KeyAttribute=`"$escapedKey`"[^>]*>", 'IgnoreCase').Value
  if (-not $tag) {
    return ''
  }
  return Get-TagAttributeValue -Tag $tag -Attribute 'content'
}

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

  $expectedCanonical = "$siteOrigin/$($edition.Page)"
  $canonicalTag = [regex]::Match($html, '<link\b[^>]*\brel="canonical"[^>]*>', 'IgnoreCase').Value
  $canonicalHref = if ($canonicalTag) { Get-TagAttributeValue -Tag $canonicalTag -Attribute 'href' } else { '' }
  if ($canonicalHref -ne $expectedCanonical) {
    throw "Missing or incorrect canonical URL in $($edition.Page): expected $expectedCanonical"
  }

  $alternateLinks = @{}
  foreach ($tagMatch in [regex]::Matches($html, '<link\b[^>]*\brel="alternate"[^>]*>', 'IgnoreCase')) {
    $hreflang = Get-TagAttributeValue -Tag $tagMatch.Value -Attribute 'hreflang'
    $href = Get-TagAttributeValue -Tag $tagMatch.Value -Attribute 'href'
    if ($hreflang) {
      $alternateLinks[$hreflang] = $href
    }
  }

  foreach ($languageCode in @('zh', 'en', 'ja', 'x-default')) {
    $expectedAlternate = "$siteOrigin/$($pageByLang[$languageCode])"
    if ($alternateLinks[$languageCode] -ne $expectedAlternate) {
      throw "Missing reciprocal hreflang '$languageCode' in $($edition.Page): expected $expectedAlternate"
    }
  }

  $ogType = Get-MetaContent -Html $html -KeyAttribute 'property' -Key 'og:type'
  $ogTitle = Get-MetaContent -Html $html -KeyAttribute 'property' -Key 'og:title'
  $ogDescription = Get-MetaContent -Html $html -KeyAttribute 'property' -Key 'og:description'
  $ogUrl = Get-MetaContent -Html $html -KeyAttribute 'property' -Key 'og:url'
  $ogImage = Get-MetaContent -Html $html -KeyAttribute 'property' -Key 'og:image'
  if ($ogType -ne 'article' -or -not $ogTitle -or -not $ogDescription -or $ogUrl -ne $expectedCanonical -or $ogImage -notmatch '^https://') {
    throw "Incomplete or inconsistent Open Graph article metadata in $($edition.Page)"
  }

  $twitterCard = Get-MetaContent -Html $html -KeyAttribute 'name' -Key 'twitter:card'
  $twitterTitle = Get-MetaContent -Html $html -KeyAttribute 'name' -Key 'twitter:title'
  $twitterDescription = Get-MetaContent -Html $html -KeyAttribute 'name' -Key 'twitter:description'
  $twitterImage = Get-MetaContent -Html $html -KeyAttribute 'name' -Key 'twitter:image'
  if ($twitterCard -ne 'summary_large_image' -or -not $twitterTitle -or -not $twitterDescription -or $twitterImage -ne $ogImage) {
    throw "Incomplete or inconsistent Twitter Card metadata in $($edition.Page)"
  }

  $blogPosting = $null
  foreach ($jsonMatch in [regex]::Matches($html, '<script\b[^>]*type="application/ld\+json"[^>]*>([\s\S]*?)</script>', 'IgnoreCase')) {
    try {
      $structuredData = $jsonMatch.Groups[1].Value | ConvertFrom-Json
      if ($structuredData.'@type' -eq 'BlogPosting') {
        $blogPosting = $structuredData
        break
      }
    }
    catch {
      throw "Invalid JSON-LD in $($edition.Page): $($_.Exception.Message)"
    }
  }

  if (-not $blogPosting) {
    throw "Missing BlogPosting JSON-LD in $($edition.Page)"
  }

  $structuredUrl = if ($blogPosting.url) { $blogPosting.url } else { $blogPosting.mainEntityOfPage.'@id' }
  if (
    -not $blogPosting.headline -or
    -not $blogPosting.description -or
    -not $blogPosting.image -or
    -not $blogPosting.datePublished -or
    -not $blogPosting.dateModified -or
    -not $blogPosting.author -or
    $blogPosting.inLanguage -ne $edition.Lang -or
    $structuredUrl -ne $expectedCanonical
  ) {
    throw "Incomplete or inconsistent BlogPosting JSON-LD in $($edition.Page)"
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

$sitemapPath = Join-Path $projectRoot 'sitemap.xml'
if (-not (Test-Path -LiteralPath $sitemapPath)) {
  throw 'Missing sitemap.xml'
}
$sitemap = Get-Content -Raw -LiteralPath $sitemapPath
foreach ($languageCode in @('zh', 'en', 'ja')) {
  $expectedUrl = "$siteOrigin/$($pageByLang[$languageCode])"
  if ($sitemap -notmatch "<loc>\s*$([regex]::Escape($expectedUrl))\s*</loc>") {
    throw "Article URL is missing from sitemap.xml: $expectedUrl"
  }
}

$robotsPath = Join-Path $projectRoot 'robots.txt'
if (-not (Test-Path -LiteralPath $robotsPath)) {
  throw 'Missing robots.txt'
}
$robots = Get-Content -Raw -LiteralPath $robotsPath
$expectedSitemapUrl = "$siteOrigin/sitemap.xml"
if ($robots -notmatch "(?im)^\s*Sitemap:\s*$([regex]::Escape($expectedSitemapUrl))\s*$") {
  throw "robots.txt does not reference $expectedSitemapUrl"
}

$workflowPath = Join-Path $projectRoot '.github/workflows/static.yml'
$workflow = Get-Content -Raw -LiteralPath $workflowPath
foreach ($seoFile in @('sitemap.xml', 'robots.txt')) {
  if ($workflow -notmatch [regex]::Escape($seoFile)) {
    throw "GitHub Pages workflow does not deploy $seoFile"
  }
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

Write-Output "OK: validated zh/en/ja pages, reciprocal language links, article SEO, sitemap, robots, deployment inclusion, hero image, JSON indexes, JavaScript, and Git diff for '$Stem'."
