# INOVIT e-Segregator HACCP - Progressive Web App

![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Nowoczesna aplikacja PWA (Progressive Web App) do zarządzania dokumentacją HACCP z pełnym wsparciem dla zapisu lokalnego i pracy offline.

## 📋 Opis

INOVIT e-Segregator HACCP to kompleksowy system zarządzania dokumentacją HACCP (Hazard Analysis and Critical Control Points) dla zakładów żywnościowych. Aplikacja zapewnia:

- ✅ **Pełną funkcjonalność offline** - działa bez połączenia z internetem
- 💾 **Lokalny zapis danych** - localStorage + IndexedDB
- 📱 **Instalacja jako aplikacja** - PWA można zainstalować na urządzeniu
- 🔄 **Automatyczna synchronizacja** - dane zapisywane są automatycznie
- 📊 **Eksport/Import danych** - możliwość kopii zapasowych
- 🎨 **Responsywny design** - działa na komputerach, tabletach i smartfonach

## 🚀 Funkcjonalności

### Moduły dokumentacji:
1. **Wprowadzenie do dokumentacji** - podstawy systemu HACCP
2. **Opis zakładu** - dane identyfikacyjne i charakterystyka
3. **Program GHP/GMP** - Dobre Praktyki Higieniczne i Produkcyjne
4. **Schemat technologiczny** - przepływ procesu produkcyjnego
5. **Analiza zagrożeń HACCP** - identyfikacja i ocena zagrożeń
6. **Rejestry i zapisy** - kontrola temperatury, dostaw
7. **Działania korygujące** - rejestr problemów i działań
8. **Szkolenia pracowników** - plan i harmonogram
9. **Audyty i weryfikacja** - kontrola wewnętrzna
10. **Plan i rejestr badań** - badania laboratoryjne

### Technologie PWA:
- ⚡ **Service Worker** - obsługa offline i cache
- 📦 **Manifest.json** - konfiguracja PWA
- 💿 **IndexedDB** - baza danych w przeglądarce
- 🗂️ **LocalStorage** - szybki dostęp do danych
- 🔔 **Push Notifications** (gotowe do rozbudowy)

## 📦 Struktura projektu

```
Demo/
├── public/
│   ├── css/
│   │   └── styles.css          # Style aplikacji
│   ├── js/
│   │   ├── app.js              # Główna logika aplikacji
│   │   └── storage.js          # Zarządzanie localStorage/IndexedDB
│   ├── icons/
│   │   ├── icon-*.svg          # Ikony PWA (różne rozmiary)
│   │   └── README.md           # Informacje o ikonach
│   ├── index.html              # Główny plik HTML
│   ├── manifest.json           # Manifest PWA
│   └── sw.js                   # Service Worker
├── generate-icons.sh           # Skrypt generujący ikony
├── demo_source.html            # Oryginalne demo (backup)
└── README.md                   # Ten plik
```

## 🛠️ Instalacja i uruchomienie

### Wymagania:
- Serwer HTTP (np. Live Server, Python HTTP Server, nginx)
- Nowoczesna przeglądarka (Chrome, Firefox, Safari, Edge)

### Opcja 1: Live Server (VS Code)
```bash
# Zainstaluj rozszerzenie Live Server w VS Code
# Kliknij prawym przyciskiem na index.html -> "Open with Live Server"
```

### Opcja 2: Python HTTP Server
```bash
cd public
python3 -m http.server 8000
# Otwórz http://localhost:8000 w przeglądarce
```

### Opcja 3: Node.js http-server
```bash
npm install -g http-server
cd public
http-server -p 8000
# Otwórz http://localhost:8000 w przeglądarce
```

### Opcja 4: PHP Built-in Server
```bash
cd public
php -S localhost:8000
# Otwórz http://localhost:8000 w przeglądarce
```

## 📱 Instalacja jako PWA

### Na komputerze (Chrome/Edge):
1. Otwórz aplikację w przeglądarce
2. W pasku adresu kliknij ikonę instalacji (+)
3. Lub: Menu → "Zainstaluj INOVIT HACCP..."

### Na Android:
1. Otwórz aplikację w Chrome
2. Kliknij "Dodaj do ekranu głównego"
3. Potwierdź instalację

### Na iOS:
1. Otwórz aplikację w Safari
2. Kliknij przycisk "Udostępnij" (kwadrat ze strzałką)
3. Wybierz "Dodaj do ekranu głównego"

## 💾 Zarządzanie danymi

### Eksport danych:
```javascript
// W aplikacji kliknij: "Eksport" w górnym menu
// Zapisze plik JSON z wszystkimi danymi
```

### Import danych:
```javascript
// W aplikacji kliknij: "Import" w górnym menu
// Wybierz wcześniej wyeksportowany plik JSON
```

### Statystyki:
```javascript
// Kliknij "Statystyki" aby zobaczyć:
// - Wykorzystanie localStorage
// - Liczba rekordów w IndexedDB
// - Status połączenia (online/offline)
```

## 🔧 Konfiguracja

### Zmiana kolorów (public/css/styles.css):
```css
:root {
    --primary-color: #004F5D;      /* Kolor główny */
    --secondary-color: #007380;    /* Kolor dodatkowy */
    --accent-color: #00E5FF;       /* Kolor akcentu */
    --success-color: #28a745;      /* Sukces */
    --warning-color: #ffc107;      /* Ostrzeżenie */
    --danger-color: #dc3545;       /* Niebezpieczeństwo */
}
```

### Generowanie własnych ikon:

#### Używając dostarczonego skryptu:
```bash
./generate-icons.sh
```

#### Używając ImageMagick (jeśli dostępny):
```bash
# Konwersja SVG na PNG
cd public/icons
for size in 72 96 128 144 152 192 384 512; do
    convert icon-${size}x${size}.svg icon-${size}x${size}.png
done
```

#### Używając generatorów online:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)

## 📊 API Storage Manager

### Podstawowe operacje:

```javascript
// Zapis danych
await storage.save('facility', {
    name: 'Moja Firma',
    nip: '123-456-78-90'
});

// Odczyt danych
const facilityData = await storage.load('facility');

// Dodanie rekordu
await storage.addItem('temperatureLog', {
    date: '2025-01-17',
    device: 'Chłodnia nr 1',
    temperature: 2
});

// Aktualizacja rekordu
await storage.updateItem('temperatureLog', id, {
    temperature: 3
});

// Usunięcie rekordu
await storage.deleteItem('temperatureLog', id);

// Eksport wszystkich danych
const exportData = await storage.exportData();

// Import danych
await storage.importData(jsonData);

// Statystyki
const stats = await storage.getStats();

// Czyszczenie wszystkich danych
await storage.clearAll();
```

## 🔐 Bezpieczeństwo danych

- ✅ Wszystkie dane przechowywane lokalnie w przeglądarce użytkownika
- ✅ Brak wysyłania danych do serwera (pełna prywatność)
- ✅ Szyfrowanie podczas eksportu (opcjonalne - do rozbudowy)
- ⚠️ **Ważne**: Regularnie wykonuj kopie zapasowe (eksport danych)

## 🌐 Wsparcie przeglądarek

| Przeglądarka | Wersja | PWA | Service Worker | IndexedDB |
|-------------|--------|-----|----------------|-----------|
| Chrome      | 67+    | ✅  | ✅             | ✅        |
| Firefox     | 44+    | ✅  | ✅             | ✅        |
| Safari      | 11.1+  | ✅  | ✅             | ✅        |
| Edge        | 17+    | ✅  | ✅             | ✅        |
| Opera       | 45+    | ✅  | ✅             | ✅        |

## 🐛 Rozwiązywanie problemów

### Aplikacja nie działa offline:
```bash
# Sprawdź czy Service Worker jest zarejestrowany:
# DevTools → Application → Service Workers
# Powinien być status "Activated and is running"
```

### Dane nie są zapisywane:
```bash
# Sprawdź console w DevTools (F12)
# Sprawdź dostępność localStorage:
localStorage.setItem('test', 'value')
localStorage.getItem('test')
```

### Ikony się nie wyświetlają:
```bash
# Sprawdź ścieżki w manifest.json
# Upewnij się że pliki SVG istnieją w public/icons/
ls -la public/icons/
```

## 📞 Wsparcie

### INOVIT:
- 📧 Email: kontakt@inovit.com.pl
- 📱 Tel: +48 575-757-638
- 🌐 Web: [www.inovit.com.pl](https://www.inovit.com.pl)

### Zgłaszanie problemów:
Jeśli napotkasz problem, stwórz Issue na GitHubie z informacjami:
- Przeglądarka i wersja
- System operacyjny
- Opis problemu
- Kroki reprodukcji
- Screenshots (jeśli możliwe)

## 🚀 Rozwój

### Planowane funkcje:
- [ ] Synchronizacja z chmurą (opcjonalnie)
- [ ] Zaawansowane raporty PDF
- [ ] Powiadomienia push o terminach
- [ ] Integracja z czytnikami kodów kreskowych
- [ ] Wielojęzyczność (EN, DE, etc.)
- [ ] Dark mode
- [ ] Zaawansowane filtry i wyszukiwanie
- [ ] Eksport do Excel/CSV
- [ ] Podpisy cyfrowe dokumentów

### Technologie do rozbudowy:
- [ ] TypeScript dla lepszej typu safety
- [ ] React/Vue dla bardziej złożonego UI
- [ ] Webpack/Vite dla bundling
- [ ] Jest/Vitest dla testów
- [ ] Cypress dla testów E2E

## 📄 Licencja

MIT License - możesz swobodnie używać, modyfikować i dystrybuować.

## 👥 Autorzy

Opracowane przez **INOVIT** - eksperci w cyfryzacji dokumentacji HACCP

Bazowane na demo dostępnym na: [https://inovit.com.pl/demo2](https://inovit.com.pl/demo2)

## 🙏 Podziękowania

- Font Awesome - za ikony
- Google Fonts - za czcionki
- Społeczność PWA - za wsparcie i dokumentację

---

**Wersja:** 1.0.0
**Data:** 2025-01-17
**Status:** ✅ Gotowe do użycia

## 📝 Changelog

### v1.0.0 (2025-01-17)
- ✨ Pierwsza wersja PWA
- 💾 Pełny zapis lokalny (localStorage + IndexedDB)
- 📱 Obsługa offline
- 🎨 Responsywny design
- 📊 Eksport/Import danych
- 🔄 Service Worker
- 📋 10 modułów dokumentacji HACCP
- 🎯 Manifest PWA
- 🖼️ Ikony SVG
