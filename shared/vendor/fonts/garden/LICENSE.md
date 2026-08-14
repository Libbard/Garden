# Bundled webfonts

All font files in this directory are licensed under the
**SIL Open Font License, Version 1.1** (OFL-1.1), which permits
bundling and redistribution with this project.

| Family | Designers / Foundry | License |
|---|---|---|
| IBM Plex Sans Arabic | IBM / Bold Monday | OFL-1.1 |
| Cairo | Gaser Mostafa Ahmed, Mohamed Gaber | OFL-1.1 |
| Tajawal | Boutros Fonts | OFL-1.1 |
| Almarai | Boutros Fonts | OFL-1.1 |
| Readex Pro | Thomas Jockin, Nadine Chahine, Santiago Orozco | OFL-1.1 |
| Noto Naskh Arabic | Google | OFL-1.1 |
| Inter | Rasmus Andersson | OFL-1.1 |
| Literata | TypeTogether | OFL-1.1 |
| Atkinson Hyperlegible | Braille Institute of America | OFL-1.1 |

Full license text: https://openfontlicense.org/

Only the `arabic` and `latin` unicode subsets are bundled, at the weights
declared in `garden-fonts.css`. A family is downloaded by the browser only
when a reader selects it.

The last three families cover Latin only and are offered on English pages;
the six above them cover Arabic and are offered on Arabic pages. Inter and
Literata are shipped as single variable files covering their whole weight
range, so one download serves every weight the page asks for.
