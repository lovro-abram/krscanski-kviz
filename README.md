# Krščanski Kviz – Pripomoček za učitelje

Ta spletna aplikacija je namenjena učiteljem in katehetom kot pripomoček pri pripravi kvizov ali ponavljanju snovi o krščanstvu. Omogoča enostavno iskanje, filtriranje in izvoz vprašanj.

## Glavne funkcionalnosti

- **Zbirka vprašanj:** Pregleden seznam vprašanj z odgovori, razvrščenih po težavnosti in kategorijah.
- **Filtriranje:** Možnost filtriranja vprašanj po težavnosti (1-5) in različnih vsebinskih kategorijah.
- **Iskanje:** Hitro iskanje po besedilu vprašanj in odgovorov.
- **Priljubljena vprašanja:** Uporabnik si lahko ustvari lasten seznam izbranih vprašanj (shranjeno lokalno v brskalniku).
- **Izvoz v PDF:** Možnost izvoza trenutno filtriranih ali priljubljenih vprašanj v PDF dokument, primeren za tiskanje. Učitelj lahko izbere, ali želi vključiti tudi odgovore.
- **Deljenje:** Možnost kopiranja seznama vprašanj v odložišče za nadaljnjo uporabo v drugih dokumentih.

## Tehnična struktura

Projekt je zasnovan kot statična spletna stran:

- `index.html`: Osnovna struktura strani.
- `slog.css`: Vsi vizualni slogi (vključno z odzivnostjo za mobilne naprave).
- `app.js`: Logika aplikacije, upravljanje filtrov, iskanja in izvoza.
- `vprasanja.json`: Podatkovna baza vprašanj v formatu JSON.

## Upravljanje vprašanj

Vprašanja lahko dodajate ali urejate neposredno v datoteki `vprasanja.json`. Vsako vprašanje ima naslednjo strukturo:

```json
{
  "vprašanje": "Besedilo vprašanja?",
  "odgovor": "Besedilo odgovora",
  "kategorije": ["Kategorija 1", "Kategorija 2"],
  "težavnost": 3
}
```

## Uporaba

Za zagon aplikacije preprosto odprite datoteko `index.html` v katerem koli modernem spletnem brskalniku. Za pravilno delovanje nalaganja JSON datoteke v nekaterih brskalnikih boste morda potrebovali lokalni strežnik (npr. VS Code Live Server ali `python -m http.server`).
