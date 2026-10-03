# Le fil des cadeaux — Fire Emblem: Fortune's Weave

Guide des cadeaux pour *Fire Emblem: Fortune's Weave*, en français.

Version en ligne : https://ly-ten.github.io/fe-gift-tactician/

## Ce que fait l'outil

- **Recrutement** : qui rejoint ton armée selon le Seigneur de la Flamme joué et ton niveau d'Honneur, avec les conditions propres à chaque voie.
- **Cadeaux préférés** : pour chaque personnage, ce qu'il adore, aime beaucoup, aime bien ou qu'il faut éviter.
- **Inventaire** : tes cadeaux en stock, avec les quantités.
- **Tournée de la semaine** : répartition automatique de ton inventaire entre les personnages qui ont encore besoin de soutien, meilleur cadeau d'abord.
- **Où trouver les cadeaux** : marchés par ville, quêtes à date limite, et tes propres repères.

## Confort

- **Téléphone et ordinateur** : sur grand écran, la page passe en trois colonnes (menu, liste, fiche). Sur téléphone, l'en-tête se réduit à une barre fine une fois le Seigneur choisi.
- **Thème rétro** : le bouton de thème passe de clair à sombre, puis à un thème façon Fire Emblem sur Game Boy Advance.
- **Application installable** : l'outil s'installe sur l'écran d'accueil et fonctionne sans connexion. Sur Android et sur ordinateur, utilise le bouton « Installer ». Sur iPhone, dans Safari : Partager, puis « Sur l'écran d'accueil ».

## Tes données

Tout est enregistré dans le navigateur (localStorage) : rien ne quitte ton appareil. Le bouton **⇅ (Sauvegarde)** exporte toutes tes données sous forme de code, et permet de les importer d'une version de l'outil à l'autre. Pour passer de l'ordinateur au téléphone, affiche le QR code dans Sauvegarde et scanne-le avec l'appareil photo : les données voyagent dans le lien lui-même, sans serveur. Garde aussi le code dans une note : c'est ta copie de secours.

Sur iPhone, l'app installée sur l'écran d'accueil garde ses propres données, séparées de celles de Safari : transfère-les avec la Sauvegarde.

## Technique

Site statique, rien à compiler. Les icônes pixel art sont originales et dessinées en code dans `tools/icons.js` ; pour les régénérer : `node tools/icons.js` (produit `pixel-art.css` et `icons/`).

## Mentions

Projet de fan non officiel, non affilié à Nintendo, Intelligent Systems ou Koei Tecmo. *Fire Emblem* est une marque de Nintendo.

Générateur de QR code : [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) de Kazuhiko Arase, licence MIT.
