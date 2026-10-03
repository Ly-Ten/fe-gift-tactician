# Le fil des cadeaux — Fire Emblem: Fortune's Weave

Guide des cadeaux pour *Fire Emblem: Fortune's Weave*, en français.

Version en ligne : https://ly-ten.github.io/fe-gift-tactician/

## Ce que fait l'outil

- **Recrutement** : qui rejoint ton armée selon le Seigneur de la Flamme joué et ton niveau d'Honneur, avec les conditions propres à chaque voie.
- **Cadeaux préférés** : pour chaque personnage, ce qu'il adore, aime beaucoup, aime bien ou qu'il faut éviter.
- **Inventaire** : tes cadeaux en stock, avec les quantités.
- **Tournée de la semaine** : répartition automatique de ton inventaire entre les personnages qui ont encore besoin de soutien, meilleur cadeau d'abord.
- **Où trouver les cadeaux** : marchés par ville, quêtes à date limite, et tes propres repères.
- **Liste de courses** : dans la Tournée, le moins d'achats possible pour les personnages qui n'ont rien de bon en stock, regroupés par ville avec le coût total.
- **Carte du monde** : villes, routes, relais, temples, donjons et points de récolte, de pêche et de minerai. Une fiche par lieu avec ses boutiques et ses récoltes, la recherche de n'importe quel objet, et des itinéraires qui suivent les routes, dont une tournée des courses. Les régions pas encore atteintes restent grisées, sans lieux ni noms, pour éviter les spoilers.
- **Résumé** : progression du recrutement pour chaque Seigneur, personnages prêts, tournée, courses, prochaine quête à date limite et dernière sauvegarde.

## Confort

- **Téléphone, tablette, pliant et ordinateur** : la mise en page suit la largeur de l'écran.
  - Téléphone et pliant replié : une colonne, la fiche s'ouvre par le bas.
  - Tablette en portrait et pliant déplié : deux volets égaux, liste et fiche, séparés au niveau du pli. L'en-tête tient sur une ligne et reste en haut.
  - Tablette en paysage et ordinateur : trois colonnes, avec le menu à gauche.
  - Sur les pliants dont le navigateur signale la charnière, aucun contenu ne passe dessous.
- **Thèmes** : un bouton jour/nuit et un bouton rétro, façon Fire Emblem sur Game Boy Advance.
- **En-tête toujours visible** : le Seigneur, l'Honneur et les boutons restent en haut pendant le défilement, sur téléphone comme sur tablette.
- **Recherche** : une seule barre, qui signale aussi les personnages, cadeaux et villes trouvés dans les autres rubriques.
- **Épingles** : l'étoile d'une fiche place le personnage en haut de la liste et le sert en premier dans la tournée.
- **Date du jeu** : indiquée dans « À ne pas rater », elle affiche les jours restants avant chaque quête.
- **Rappel de sauvegarde** au bout d'une semaine sans export.
- **Application installable** : l'outil s'installe sur l'écran d'accueil et fonctionne sans connexion. Sur Android et sur ordinateur, utilise le bouton « Installer ». Sur iPhone, dans Safari : Partager, puis « Sur l'écran d'accueil ».

## Tes données

Tout est enregistré dans le navigateur (localStorage) : rien ne quitte ton appareil. Le bouton **⇅ (Sauvegarde)** exporte toutes tes données sous forme de code, et permet de les importer d'une version de l'outil à l'autre. Pour passer de l'ordinateur au téléphone, affiche le QR code dans Sauvegarde et scanne-le avec l'appareil photo : les données voyagent dans le lien lui-même, sans serveur. Garde aussi le code dans une note : c'est ta copie de secours.

Sur iPhone, l'app installée sur l'écran d'accueil garde ses propres données, séparées de celles de Safari : transfère-les avec la Sauvegarde.

## Technique

Site statique, rien à compiler. Les icônes pixel art sont originales et dessinées en code dans `tools/icons.js` ; pour les régénérer : `node tools/icons.js` (produit `pixel-art.css` et `icons/`). Les données de la carte (`data/map.json`) sont produites par `node tools/build-map.js` à partir d'un dossier de recherche local, non publié.

## Mentions

Projet de fan non officiel, non affilié à Nintendo, Intelligent Systems ou Koei Tecmo. *Fire Emblem* est une marque de Nintendo.

Carte : carte de fan redessinée en pixel art d'après la carte du jeu. Lieux, positions et stocks compilés à partir de Fextralife, IGN, RPG Site, VGC, Game8, Siliconera, Gematsu et NightlyGamingBinge. Aucune image du jeu n'est publiée ; le jeu fait foi.

Générateur de QR code : [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) de Kazuhiko Arase, licence MIT.
