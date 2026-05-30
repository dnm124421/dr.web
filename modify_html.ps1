$files = Get-ChildItem -Path '.' -Filter '*.html' -Recurse
foreach ($file in $files) {
    $content = Get-Content $file -Raw
    # Insert responsive.css link after style.css link
    if ($content -match '(?i)<link\s+rel="stylesheet"\s+href="style\.css"\s*>') {
        $content = $content -replace '(?i)(<link\s+rel="stylesheet"\s+href="style\.css"\s*>)', "`$1`n    <link rel='stylesheet' href='responsive.css'/>"
    }
    # Insert hamburger button after brand logo inside nav
    if ($content -match '(?i)<nav[^>]*>.*?<a[^>]*class="brand-logo"[^>]*>.*?</a>') {
        $content = $content -replace '(?i)(<a[^>]*class="brand-logo"[^>]*>.*?</a>)', "`$1`n        <button class='hamburger-btn' id='hamburgerBtn'><i class='fa-solid fa-bars'></i></button>"
    }
    # Insert mobile overlay div after closing nav tag
    if ($content -match '(?i)</nav>') {
        $content = $content -replace '(?i)</nav>', "</nav>`n    <div class='mobile-nav-overlay' id='mobileNavOverlay'></div>"
    }
    Set-Content -Path $file -Value $content -Encoding UTF8
}
