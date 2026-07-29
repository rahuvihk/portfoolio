param(
  [int]$MaxWidth = 1600,
  [int]$Quality  = 78
)

Add-Type -AssemblyName System.Drawing

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

function Process-Dir($srcPath, $maxW) {
  if (-not (Test-Path $srcPath)) { return }
  $src = Get-Item $srcPath
  $outDir = Join-Path $src.FullName "thumb"
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
  $out = Get-Item $outDir

  Get-ChildItem -Path $src.FullName -File | Where-Object {
    $_.Extension -match '^\.(jpe?g|png)$'
  } | ForEach-Object {
    $inFile  = $_.FullName
    $outFile = Join-Path $out.FullName ($_.BaseName + ".jpg")

    if ((Test-Path $outFile) -and (Get-Item $outFile).LastWriteTime -ge $_.LastWriteTime) {
      Write-Host "skip  $($_.Name)"; return
    }

    $img = [System.Drawing.Image]::FromFile($inFile)
    try {
      # Honor EXIF orientation (tag 0x0112) — System.Drawing ignores it otherwise.
      $orient = 1
      if ($img.PropertyIdList -contains 0x0112) {
        $orient = $img.GetPropertyItem(0x0112).Value[0]
      }
      switch ($orient) {
        2 { $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        4 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
        5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
      $w = $img.Width; $h = $img.Height
      if ($w -gt $maxW) {
        $ratio = $maxW / $w
        $nw = [int]$maxW
        $nh = [int][Math]::Round($h * $ratio)
      } else {
        $nw = $w; $nh = $h
      }
      $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality= [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.DrawImage($img, 0, 0, $nw, $nh)
      $g.Dispose()
      $bmp.Save($outFile, $jpegCodec, $params)
      $bmp.Dispose()
      $inKB  = [int]($_.Length / 1KB)
      $outKB = [int]((Get-Item $outFile).Length / 1KB)
      Write-Host ("done  {0}  {1}KB -> {2}KB  ({3}x{4})" -f $_.Name,$inKB,$outKB,$nw,$nh)
    } finally {
      $img.Dispose()
    }
  }
}

# Landing-page and cover images (larger max width — used on big panes)
Process-Dir "images" 1600

# Klõpsud album (grid tiles — smaller is fine, lightbox uses originals)
$klopsud = Get-ChildItem "images" -Directory |
  Where-Object { $_.Name -like 'kl*psud' -and (Get-ChildItem $_.FullName -File -ErrorAction SilentlyContinue).Count -gt 0 } |
  Select-Object -First 1
if ($klopsud) { Process-Dir $klopsud.FullName 1400 }
