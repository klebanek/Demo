# INOVIT e-Segregator HACCP - Progressive Web App

![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Nowoczesna aplikacja PWA (Progressive Web App) do zarządzania dokumentacją HACCP z pełnym wsparciem dla zapisu lokalnego i pracy offline.

## 📋 Opis

INOVIT e-Segregator HACCP to kompleksowy system zarządzania dokumentacją HACCP (Hazard Analysis and Critical Control Points) dla zakładów żywnościowych. Aplikacja zapewnia:

- ✅ **Pełną funkcjonalność offline** - działa bez połączenia z internetem
- 💾 **Lokalny zapis danych** - localStorage + IndexedDB
- 📱 **Instalacja jako aplikacja** - PWA można zainstalować na urządzeniu
- 🔄 **Automatyczna synchronizacja** - dane zapisywane są automatycznie
- 📊 **Zaawansowane raporty** - eksport do PDF i CSV
- 🌙 **Dark Mode** - tryb ciemny dla lepszego komfortu pracy
- 🔔 **Powiadomienia i przypomnienia** - system zarządzania terminami
- 🔍 **Globalne wyszukiwanie** - szybkie odnajdywanie informacji
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

### Nowe funkcjonalności (v2.1.0):
- 📄 **Eksport do PDF** - generowanie profesjonalnych raportów
- 📊 **Eksport do CSV** - możliwość dalszej analizy danych w arkuszach kalkulacyjnych
- 🌓 **Tryb ciemny (Dark Mode)** - automatyczne wykrywanie preferencji systemowych i przełącznik ręczny
- ⏰ **System przypomnień** - powiadomienia o terminach badań, szkoleń i audytów
- 🔎 **Wyszukiwarka globalna** - przeszukiwanie wszystkich modułów aplikacji
- 📱 **Ulepszony interfejs PWA** - lepsza integracja z systemem operacyjnym

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
│   │   ├── storage.js          # Zarządzanie localStorage/IndexedDB
│   │   ├── dark-mode.js        # Obsługa trybu ciemnego
│   │   ├── pdf-export.js       # Eksport do PDF
│   │   ├── csv-export.js       # Eksport do CSV
│   │   ├── global-search.js    # Wyszukiwarka
│   │   └── reminders.js        # System przypomnień
│   ├── icons/
│   │   ├── icon-*.svg          # Ikony PWA (różne rozmiary)
│   │   └── README.md           # Informacje o ikonach
│   ├── index.html              # Główny plik HTML
│   ├── manifest.json           # Manifest PWA
│   └── sw.js                   # Service Worker
├── src/                        # Pliki źródłowe
├── tests/                      # Testy jednostkowe
├── vite.config.js              # Konfiguracja Vite
├── package.json                # Zależności i skrypty
├── generate-icons.sh           # Skrypt generujący ikony
└── README.md                   # Ten plik
```

## 🛠️ Instalacja i uruchomienie

### Wymagania:
- Node.js (wersja 16 lub nowsza)
- npm (menedżer pakietów Node.js)

### Krok 1: Instalacja zależności
```bash
npm install
```

### Krok 2: Uruchomienie w trybie deweloperskim
```bash
npm run dev
# Aplikacja będzie dostępna pod adresem http://localhost:5173 (lub inny port wskazany przez Vite)
```

### Krok 3: Budowanie wersji produkcyjnej
```bash
npm run build
```

### Krok 4: Podgląd wersji produkcyjnej
```bash
npm run preview
```

### Alternatywne metody uruchomienia (bez Node.js):
Możesz nadal uruchomić aplikację używając prostego serwera HTTP w katalogu `public`, ale zalecany jest workflow oparty na Vite.

```bash
# Python HTTP Server
python3 -m http.server 8000
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

### Nowe opcje eksportu:
- **Eksport PDF**: Generuje sformatowany dokument z tabelami i danymi.
- **Eksport CSV**: Pobiera dane w formacie CSV do otwarcia w Excelu.

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
```

## 🔐 Bezpieczeństwo danych

- ✅ Wszystkie dane przechowywane lokalnie w przeglądarce użytkownika
- ✅ Brak wysyłania danych do serwera (pełna prywatność)
- ✅ Szyfrowanie danych w IndexedDB
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
- [ ] Integracja z czytnikami kodów kreskowych
- [ ] Wielojęzyczność (EN, DE, etc.)
- [ ] Podpisy cyfrowe dokumentów

### Technologie do rozbudowy:
- [ ] TypeScript dla lepszej typu safety
- [ ] React/Vue dla bardziej złożonego UI
- [ ] Cypress dla testów E2E

## 📄 Licencja

MIT License - możesz swobodnie używać, modyfikować i dystrybuować.

## 👥 Autorzy

Opracowane przez **INOVIT** - Krzysztof
Klebaniuk - specjalista ds haccp i zarzadzania jakosci oraz w cyfryzacji dokumentacji HACCP 

Bazowane na demo dostępnym na: [https://inovit.com.pl/demo2](https://inovit.com.pl/demo2)

## 🙏 Podziękowania

- Font Awesome - za ikony
- Google Fonts - za czcionki
- Społeczność PWA - za wsparcie i dokumentację

---

**Wersja:** 2.1.0
**Data:** 2025-01-17
**Status:** ✅ Gotowe do użycia

## 📝 Changelog

### v2.1.0 (2025-01-17)
- ✨ Dodano tryb ciemny (Dark Mode)
- 📄 Zaimplementowano eksport do PDF
- 📊 Zaimplementowano eksport do CSV
- 🔍 Dodano globalną wyszukiwarkę
- ⏰ Wdrożono system przypomnień
- 🧪 Dodano testy jednostkowe (Vitest)
- ⚡ Migracja do Vite jako narzędzia budującego
- 🛠️ Ulepszona struktura projektu i konfiguracja

### v1.0.0 (2025-01-17)
- ✨ Pierwsza wersja PWA
- 💾 Pełny zapis lokalny (localStorage + IndexedDB)
- 📱 Obsługa offline
- 🎨 Responsywny design
- 📊 Eksport/Import danych (JSON)
- 🔄 Service Worker
- 📋 10 modułów dokumentacji HACCP
