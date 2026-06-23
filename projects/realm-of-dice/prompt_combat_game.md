# Projet : Jeu de combat tactique médiéval fantasy - "Realm of Dice"

## Contexte général
Je veux créer un jeu de combat tactique mobile-first (PWA) inspiré de D&D 5e.
Le jeu se joue en 3v3 sur un plateau 6x4, tour par tour, avec le vrai système
de combat D&D (jets d20, CA, dés dégâts, actions/bonus actions/réactions).
Le design est médiéval fantasy 2D style "Grimoire vivant" - beau, intuitif,
lisible sur mobile.

---

## Stack technique
- React + Vite
- CSS natif uniquement (pas de Tailwind)
- PWA (manifest + service worker basique)
- Déployable sur GitHub Pages dès le départ
- Police Google Fonts : Cinzel (titres/noms) + Inter (UI/log)
- Aucun backend - tout tourne côté client pour l'instant

### Configuration GitHub Pages obligatoire
Dans vite.config.js :
```js
export default defineConfig({
  base: '/nom-du-repo/',
  plugins: [react()]
})
```
Et dans package.json, ajouter :
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

---

## Architecture du projet

```
/src
  /components
    Board.jsx              # Plateau 6x4 avec cases
    Token.jsx              # Token circulaire d'un personnage
    InitiativeBar.jsx      # Barre d'initiative en haut
    ActionPanel.jsx        # Panneau d'actions en bas
    CombatLog.jsx          # Log parchemin des actions
    DirectionalPad.jsx     # Flèches directionnelles pour déplacement
    StatusBadge.jsx        # Badges statuts (poison, rage, concentration...)
    VictoryScreen.jsx      # Écran de victoire/défaite
  /systems
    combat.js              # Logique complète du combat
    dice.js                # Système de jets de dés
    initiative.js          # Calcul et gestion de l'initiative
    movement.js            # Gestion déplacement plateau
    abilities.js           # Toutes les capacités par classe
    ai.js                  # IA ennemie
  /data
    classes.js             # Définition complète des 5 classes
    config.js              # Constantes du jeu
  /hooks
    useGameState.js        # État global de la partie
    useCombat.js           # Hook combat
  App.jsx
  main.jsx
```

---

## Design et identité visuelle

### Palette de couleurs
```css
--color-bg-deep: #1a1208;        /* Fond principal brun nuit */
--color-bg-board: #2a1f0e;       /* Fond plateau */
--color-stone-dark: #3d3428;     /* Cases sombres */
--color-stone-light: #4a3f30;    /* Cases claires */
--color-gold: #c9a84c;           /* Équipe alliée, accents */
--color-gold-light: #e8c96a;     /* Surbrillance or */
--color-crimson: #8b2020;        /* Équipe ennemie */
--color-crimson-light: #b53030;  /* Surbrillance rouge */
--color-text-primary: #f0e6cc;   /* Texte principal */
--color-text-muted: #9a8a6a;     /* Texte secondaire */
--color-border: #5a4a30;         /* Bordures */

/* Couleurs par classe */
--color-guerrier: #4a6fa5;
--color-mage: #7b4fa5;
--color-voleur: #2d6a4f;
--color-rodeur: #8b5e3c;
--color-clerc: #d4a843;

/* États */
--color-move-highlight: rgba(74, 111, 165, 0.35);  /* Cases accessibles */
--color-target-highlight: rgba(139, 32, 32, 0.45); /* Cibles valides */
--color-active-glow: rgba(201, 168, 76, 0.6);      /* Token actif */
```

### Typographie
- Titres, noms de personnages, noms de sorts : **Cinzel** (Google Fonts)
- Interface, log, stats : **Inter** (Google Fonts)

### Plateau de jeu
- Grille 6x4, cases carrées (environ 52px sur mobile)
- Cases alternées deux tons de pierre (--color-stone-dark / --color-stone-light)
- Bordure ornementale autour du plateau avec motifs de runes aux coins (SVG simple)
- Case active du personnage qui joue : lueur dorée pulsante (animation CSS)
- Cases accessibles en déplacement : overlay bleu translucide
- Cases des cibles valides : overlay rouge pulsant

### Tokens des personnages
Cercle de 44px avec :
- Emoji de classe centré (taille 22px) : ⚔️ 🔥 🛡️ 🏹 ✨
- Anneau coloré selon équipe : or (#c9a84c) allié / rouge (#8b2020) ennemi
- Barre de vie en arc de cercle SVG autour du token
- Badge "ACTIF" qui pulse sur le token du personnage en cours
- Effet rage : halo rouge pulsant (animation CSS keyframes)
- Quand mort : token grisé, rotation CSS 90°, opacité 0.3
- Quand touché : animation shake 0.3s
- Quand soigné : flash vert doux 0.4s

### Animations CSS obligatoires
```css
@keyframes pulse-gold { /* lueur token actif */ }
@keyframes shake { /* token touché */ }
@keyframes rage-glow { /* halo rage */ }
@keyframes flash-heal { /* soin reçu */ }
@keyframes flash-crit { /* critique */ }
@keyframes scroll-in { /* parchemin victoire */ }
```

---

## Système de combat complet

### Structure d'un tour (fidèle D&D 5e)
Chaque personnage dispose par tour de :
- **1 Action** : Attaquer, Soin divin, Dodge, Désengagement, Aider, Capacité spéciale
- **1 Bonus action** : Si une capacité le permet (Mot de guérison, Seconde attaque...)
- **Mouvement** : X cases, divisible avant et après l'action
- **1 Réaction par round** : Attaque d'opportunité, Interception, Contresort...

### Jets de dés
Chaque attaque :
1. Jet d20 + bonus d'attaque (+ bonus rage si applicable)
2. Comparé à la CA de la cible
3. Si touché : jet de dés de dégâts + modificateur
4. Affiché dans le log : "🎲 d20+5 = 17 vs CA 18 - Touché ! 🔥 1d10+3 = 9 dégâts"

Critique (d20=20) : dés de dégâts doublés
Raté critique (d20=1) : attaque ratée automatiquement
Avantage : lancer 2d20, garder le plus haut
Désavantage : lancer 2d20, garder le plus bas

### Ligne de vue
Les sorts magiques nécessitent une ligne de vue.
Si un personnage se trouve entre l'attaquant et la cible (distance intermédiaire) :
- Désavantage sur le jet d'attaque magique
Exception : certains sorts ignorent la ligne de vue (précisé dans abilities.js)

### Attaque d'opportunité
Déclenchée quand un personnage quitte une case adjacente à un ennemi sans
utiliser Désengagement ou Retraite rapide (Voleur).
- L'ennemi adjacent utilise sa réaction pour une attaque normale (jet d20 complet)
- Affiché dans le log : "⚡ ATTAQUE D'OPPORTUNITÉ - Aldric réagit !"

### Concentration (Clerc)
Certains sorts nécessitent la Concentration :
- Un seul sort de Concentration actif à la fois
- Si le Clerc reçoit des dégâts : jet de Constitution (d20+2 vs max(10, dmg/2))
- Raté : concentration brisée, sort annulé
- Lancer un autre sort de Concentration brise automatiquement le précédent

### Anti-heal
- **Poison corrosif (Voleur bonus action)** : cible reçoit 50% de soins pendant 2 tours
- **Marque maudite (Rôdeur bonus action)** : annule le prochain soin reçu par la cible
- **Disruption (Mage réaction)** : annule un sort ennemi (dont un soin), 2x/combat

### Rage comeback
Quand un allié tombe à 0 PV :
- Les survivants de l'équipe activent la Rage pendant 3 rounds
- +2 bonus d'attaque, +1d4 dégâts supplémentaires par attaque
- Halo rouge pulsant sur les tokens concernés
- Log : "⚡ RAGE - L'équipe est galvanisée par la chute d'[nom] !"

### Poison (Rôdeur)
- Appliqué en bonus action
- Inflige 3-5 dégâts par tour pendant 4 tours
- Tick en début de tour du personnage empoisonné
- Affiché dans le log à chaque tick

---

## Déplacement sur le plateau

### Mouvement aux flèches directionnelles
Quand le joueur choisit "Déplacement" :
1. Les cases accessibles s'illuminent (overlay bleu)
2. Un pavé directionnel apparaît dans le panneau d'action (↑ ↓ ← →)
3. Chaque flèche déplace le token d'une case dans cette direction
4. Un compteur "Mouvement : X/Y cases" s'affiche en temps réel
5. Bouton "Confirmer" pour valider, "Annuler" pour revenir

### Mouvement divisible
Le joueur peut :
- Déplacer, Attaquer, Déplacer à nouveau (dans la limite des cases restantes)
- L'interface montre clairement combien de cases il reste

### Règles de déplacement
- Impossible de traverser une case occupée par un allié ou ennemi
- Quitter une case adjacente à un ennemi sans Désengagement provoque une AO
- Le Voleur : Retraite rapide (bonus action) = Désengagement gratuit

---

## Les 5 classes

### Stats de base
| Classe   | PV | CA | Bonus ATK | Dé dégâts | Mouvement | Portée    |
|----------|----|----|-----------|-----------|-----------|-----------|
| Guerrier | 52 | 18 | +5        | 1d10+3    | 3 cases   | 1 case    |
| Mage     | 34 | 13 | +5        | 1d6+3     | 2 cases   | 6 cases   |
| Voleur   | 38 | 14 | +5        | 1d6+3     | 4 cases   | 1 case    |
| Rôdeur   | 44 | 15 | +5        | 1d8+3     | 3 cases   | 5 cases   |
| Clerc    | 46 | 16 | +5        | 1d8+2     | 3 cases   | 1 case    |

### Guerrier ⚔️
**Action :**
- Attaque (1d10+3, mêlée)
- Attaque puissante (2d10+3, mêlée, CD 2 tours)
- Désengagement (quitter mêlée sans AO, action complète)
- Dodge (désavantage sur toutes les attaques reçues jusqu'au prochain tour)

**Bonus action :**
- Seconde attaque (1d10, 1x/combat)
- Posture défensive (+2 CA jusqu'au prochain tour, CD 2)

**Réaction :**
- Attaque d'opportunité (jet d20 complet)
- Interception (prend le coup à la place d'un allié adjacent,
  réduit dégâts de moitié, CD 2)

**Capacité passive :**
- Second souffle (1x/combat, bonus action, soigne 1d10+4)

### Mage 🔥
**Action :**
- Sort mineur (1d6+3 magique, portée 6 cases, illimité)
- Boule de feu (2d6+3 magique, portée 6 cases, CD 2)
- Éclair (1d10+3 magique + étourdi 1 tour, portée 6 cases, CD 3)
- Télékinésie (pousse un ennemi de 2 cases, 1x/combat)
- Désengagement

**Bonus action :**
- Bouclier magique (absorbe 12 dégâts, CD 3)
- Pas de mage (+1 case de mouvement ce tour, CD 2)

**Réaction :**
- Contresort (annule un sort ennemi, 2x/combat)
- Pas d'attaque d'opportunité (le Mage n'a pas d'AO)

**Notes :**
- Sorts magiques : nécessitent ligne de vue (sinon désavantage)
- Portée 6 cases sur plateau 6x4 = peut atteindre toute la carte

### Voleur 🛡️
**Action :**
- Attaque sournoise (1d6+3 + 2d6 si avantage ou allié adjacent, mêlée)
- Double frappe (2x 1d6+3, mêlée, CD 3)
- Coup fatal (exécution si cible < 25% PV, 1x/combat, mêlée)
- Infiltration (depuis flanc, +2d6 dégâts, mêlée, CD 3)
- Désengagement (action complète)

**Bonus action :**
- Retraite rapide (Désengagement gratuit, pas de CD)
- Disparaître (avantage sur la prochaine attaque, 2x/combat)
- Poison corrosif (cible reçoit 50% soins pendant 2 tours, CD 4, 2x/combat)
- Esquive (Dodge en bonus action, CD 2)

**Réaction :**
- Esquive réflexe (réduit dégâts reçus de 50%, 2x/combat)
- Attaque d'opportunité

**Note :** L'attaque sournoise fonctionne si le Voleur a l'avantage
OU si un allié est adjacent à la cible.

### Rôdeur 🏹
**Action :**
- Tir précis (1d8+3, portée 5 cases)
- Tir double (2x 1d8+3, portée 5 cases, CD 4)
- Marque de chasse (marque une cible : +1d6 dégâts reçus de toutes sources,
  portée 5 cases, CD 4)
- Frappe explosive (1d8+7, perce l'armure, CD 3)

**Bonus action :**
- Poison (3-5 dégâts/tour pendant 4 tours, 2x/combat, CD 3)
- Marque maudite (annule prochain soin de la cible, 1x/combat, CD 4)
- Couverture (Dodge en bonus action, CD 2)

**Réaction :**
- Tir de représailles (attaque gratuite si un allié tombe à 0 PV, 1x/combat)
- Attaque d'opportunité (portée 1 case uniquement pour AO)

### Clerc ✨
**Action :**
- Frappe sacrée (1d8+2 magique, mêlée)
- Soin divin (3d8+5, soigne un allié ou soi-même, portée 1 case,
  CD 4, brise la concentration)
- Purification (retire poison et malédictions, portée 1 case, CD 3)
- Désengagement
- Aider (donne avantage à un allié adjacent sur sa prochaine attaque)

**Bonus action :**
- Mot de guérison (1d8+3, soigne, portée 3 cases, CD 3)
- Bouclier de foi (absorbe 10 dégâts sur un allié, Concentration,
  portée 2 cases, CD 3)

**Réaction :**
- Mot de guérison d'urgence (soigne 1d8+3 un allié qui tombe à 0 PV,
  le maintient à 1 PV, 2x/combat)
- Interception divine (réduit dégâts d'un allié adjacent de 1d6+3, CD 2)
- Attaque d'opportunité

**Concentration :**
- Bouclier de foi : Concentration, dure 3 tours ou jusqu'à bris
- Jet de sauvegarde si dégâts reçus : d20+2 vs max(10, dmg/2)

---

## Interface mobile

### Layout général (portrait)
```
┌─────────────────────────┐
│  BARRE D'INITIATIVE     │  ← tokens miniatures dans l'ordre
├─────────────────────────┤
│                         │
│    PLATEAU 6x4          │  ← zone principale
│    (cases de pierre)    │
│                         │
├─────────────────────────┤
│  LOG DE COMBAT          │  ← 3 dernières lignes visibles
├─────────────────────────┤
│  STATS PERSO ACTIF      │  ← PV, CA, statuts
├─────────────────────────┤
│  BOUTONS D'ACTION       │  ← grille 2x2 ou 2x3
│  [Attaquer] [Déplacer]  │
│  [Bonus]    [Réaction]  │
└─────────────────────────┘
```

### Boutons d'action
- Hauteur minimum 48px (tactile mobile)
- Style parchemin avec bordure ornementale légère
- Grisé + non-cliquable si CD actif ou conditions non remplies
- Indication CD : "Attaque puissante (CD: 2)"

### Pavé directionnel (mode déplacement)
Remplace les boutons d'action quand "Déplacer" est sélectionné :
```
     [↑]
[←]  [ ]  [→]
     [↓]
[Confirmer] [Annuler]
```
Boutons 56px minimum, bien espacés pour éviter les erreurs tactiles.

### Log de combat
Style parchemin déroulant :
- Fond légèrement plus clair que le bg principal
- Bordure supérieure ornementale
- 3 entrées visibles, scrollable vers le haut
- Chaque entrée : icône + texte + résultat coloré
- Critiques en or avec légère animation
- Soins en vert
- Attaques ratées en gris italique

---

## IA ennemie

L'IA contrôle l'équipe ennemie avec une logique simple mais cohérente :

**Priorités dans l'ordre :**
1. Si un allié est à < 30% PV et le Clerc peut soigner, soigner en priorité
2. Si un ennemi est à < 25% PV et le Voleur peut exécuter, Coup fatal
3. Si le Mage est exposé (ennemi adjacent), reculer avec Pas de mage ou Désengagement
4. Attaquer la cible avec le moins de PV atteignable
5. Se déplacer vers la cible la plus proche si hors portée
6. Utiliser les bonus actions (poison, posture, etc.) si pertinent

**Gestion des AO :**
L'IA utilise Désengagement ou Retraite rapide avant de quitter la mêlée
si elle a la capacité disponible.

---

## Navigation et écrans du jeu

### Hub (page d'accueil)
Le hub est l'écran central du jeu. On le quitte en entrant en combat (full screen),
on y revient après le combat. Pas de nav bar persistante en combat.

**Fond :**
- Dégradé radial du brun nuit (#1a1208) vers un brun plus chaud au centre (#2a1f0e)
- Vignette sombre sur les bords
- Prévu pour accueillir une texture parchemin en overlay plus tard

**Titre :**
- "Realm of Dice" en Cinzel, couleur dorée (#c9a84c)
- text-shadow doré subtil pour effet lumineux
- Emplacement réservé pour un logo stylisé futur

**Nav bar en bas (4 onglets) :**
| Onglet       | Icône  | État V1                          |
|--------------|--------|----------------------------------|
| Combat       | ⚔️     | Actif → mène à sélection d'équipe |
| Campagne     | 📜     | Grisé (#9a8a6a) + cadenas 🔒, non cliquable |
| Boutique     | 🛒     | Grisé (#9a8a6a) + cadenas 🔒, non cliquable |
| Paramètres   | ⚙️     | Actif → langue, son on/off       |

- Style : icône au-dessus du label, police Inter
- Onglets grisés : opacité réduite, curseur désactivé
- Hauteur minimum 56px pour zone tactile mobile

### Écran de sélection d'équipe (depuis onglet Combat)
- Le joueur choisit 3 classes parmi les 5
- Affichage de la composition choisie avec stats
- Bouton "Lancer le combat", génère une équipe ennemie aléatoire

### Écran de combat (principal)
Voir layout ci-dessus.

### Écran de victoire/défaite
Parchemin qui se déroule avec animation CSS (scroll-in).
- "VICTOIRE" ou "DÉFAITE" en Cinzel, grand format
- Stats du combat : rounds, dégâts infligés, dégâts reçus, soins prodigués
- Bouton "Rejouer"

---

## Ce que je veux pour la première session Claude Code

### Étape 1 - Setup du projet
1. Initialiser Vite + React
2. Configurer GitHub Pages (vite.config.js + package.json)
3. Installer gh-pages : `npm install --save-dev gh-pages`
4. Créer la structure de dossiers complète
5. Importer les polices Cinzel + Inter depuis Google Fonts
6. Créer les variables CSS dans index.css

### Étape 2 - Les données des classes
1. Créer /src/data/classes.js avec les 5 classes complètes
2. Créer /src/systems/dice.js avec les fonctions de jets de dés
3. Tester que les jets de dés fonctionnent correctement

### Étape 3 - Le plateau
1. Créer le composant Board.jsx (grille 6x4)
2. Créer le composant Token.jsx (token circulaire)
3. Afficher les 6 personnages sur le plateau avec leurs positions initiales
4. Vérifier le rendu sur mobile (portrait)

### Ne pas encore implémenter lors de la première session :
- L'IA ennemie complète
- Le système de combat complet
- Les animations
On valide d'abord que la structure et le plateau fonctionnent.

---

## Variables d'environnement
Aucune clé API requise pour ce projet, tout est local.

## Notes importantes
- Mobile-first : tout doit être testé en vue portrait 390px de large
- Commenter le code en français
- Utiliser des constantes nommées, pas de magic numbers
- Le plateau est indexé [x][y] ou x=colonne (0-5), y=ligne (0-3)
- Équipe alliée démarre colonnes 0-1, équipe ennemie colonnes 4-5
- Toujours valider qu'une case est dans les limites avant déplacement
