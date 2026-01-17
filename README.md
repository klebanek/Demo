# Ikony PWA

To jest katalog dla ikon aplikacji PWA.

## Wymagane rozmiary:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px
- 384x384px
- 512x512px

## Jak dodać własne ikony:

1. Stwórz ikony w wymaganych rozmiarach
2. Nazwij je zgodnie ze schematem: `icon-{rozmiar}.png`
   Przykład: `icon-192x192.png`
3. Umieść je w tym katalogu
4. Ikony powinny przedstawiać logo INOVIT lub symbol związany z HACCP

## Tymczasowe rozwiązanie:

Obecnie używamy prostych ikon SVG jako placeholder.
Do produkcji zalecamy stworzenie profesjonalnych ikon graficznych.

## Narzędzia do generowania ikon:

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/
- Adobe Illustrator / Figma dla projektowania
- ImageMagick dla konwersji: `convert icon.svg -resize 192x192 icon-192x192.png`
