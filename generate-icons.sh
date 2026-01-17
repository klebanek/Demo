#!/bin/bash

# Script to generate PWA icons
# This creates simple placeholder icons with INOVIT branding

ICON_DIR="public/icons"
SIZES=(72 96 128 144 152 192 384 512)

# Create SVG template
create_svg() {
    local size=$1
    local output=$2

    cat > "$output" << EOF
<svg width="$size" height="$size" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#004F5D;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#007380;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="$size" height="$size" fill="url(#grad)" rx="$(($size/8))" />
    <g transform="translate($(($size/4)), $(($size/4)))">
        <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="$(($size/5))" font-weight="bold" fill="#00E5FF">
            INOVIT
        </text>
        <text x="50%" y="70%" text-anchor="middle" font-family="Arial, sans-serif" font-size="$(($size/8))" fill="white">
            HACCP
        </text>
    </g>
</svg>
EOF
}

# Generate icons
echo "Generowanie ikon PWA..."

for size in "${SIZES[@]}"; do
    svg_file="$ICON_DIR/icon-${size}x${size}.svg"
    create_svg $size "$svg_file"
    echo "✓ Utworzono $svg_file"
done

echo ""
echo "Ikony SVG zostały utworzone w katalogu $ICON_DIR"
echo ""
echo "UWAGA: SVG może nie być wspierane przez wszystkie przeglądarki jako ikony PWA."
echo "Zalecamy konwersję do PNG używając narzędzi online lub ImageMagick:"
echo ""
echo "  convert icon-192x192.svg icon-192x192.png"
echo ""
echo "Lub użyj generatora online:"
echo "  https://realfavicongenerator.net/"
echo ""
