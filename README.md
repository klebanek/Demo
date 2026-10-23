# Keto

Prosty dziennik wagi, tkanki tłuszczowej i aktywności w stylu iOS / Things 3.
Czysty HTML + CSS + JS, bez zależności i bez budowania. Działa jako PWA (offline).

## Funkcje
- **Dodaj pomiar** – waga (kg) i opcjonalnie tłuszcz (%), jeden pomiar na dzień.
- **Dodaj aktywność** – dystans (km) i czas (min); tempo liczy się samo.
- Tabela z różnicą **dzienną** i **łączną** (waga i tłuszcz), dotknięcie wiersza = edycja/usuwanie.
- Wykres wagi lub tłuszczu (7 / 30 / 90 dni / wszystko) z linią **trendu** (wygładzanie wykładnicze) i tempem zmian w kg/tydzień. Przesuń palcem po wykresie, by zobaczyć wartości.
- Jasny i ciemny motyw, eksport/import kopii JSON.

## Uruchomienie
```
python3 -m http.server 8000   # albo dowolny serwer statyczny
```
Otwórz `http://localhost:8000`. Na iPhonie: Udostępnij → Dodaj do ekranu początkowego.
Dane są zapisywane lokalnie w `localStorage` – zrób kopię przez „Eksportuj kopię”.
