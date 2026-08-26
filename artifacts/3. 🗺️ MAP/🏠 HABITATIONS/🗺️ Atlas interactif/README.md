# Atlas interactif — Maison des Bellarosa

Carte de jeu pour les parties en mode roleplay et pour l’implémentation du projet **L’Homme Volant**.

Le code source canonique de l’atlas est ici. L’application preview en reprend les modules (`src/lib/map/`, `src/components/atlas/`).

## Ce que l’atlas permet

- Parcourir des étages empilés, tracer des pièces, poser des zones
- **Aligner** portes, fenêtres et escaliers sur les murs des pièces (aimantation, bouton « Coller au mur »)
- Lire le dossier de chaque pièce dans la page
- Zoomer le plan (boutons, pincement, Ctrl+molette, double-clic)
- **Propriétés** configurables : type (texte, choix, tags, nombre, interrupteur, couleur, pions…), icône, données prédéfinies nommées, variables libres
- Recréer les pions comme une propriété : chaque pion a les variables que vous définissez (abréviation, couleur, rôle, etc.) et se pose sur le plan
- Filtrer le plan selon les propriétés filtrables
- Personnaliser couleurs, polices et coins depuis Paramètres
- Poser la scène en cours, prendre des notes, copier un résumé de session

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `atlas-des-pieces.md` | Catalogue lisible, pièce par pièce |
| `data/house.json` | Données exportées (plans, textes, liaisons) |
| `src/lib/map/` | Géométrie, pièces, session, fusions d’éditions |
| `src/lib/map/props.ts` | Schéma des propriétés (types, icônes, variables) |
| `src/lib/map/snap.ts` | Aimantation des portes / fenêtres / escaliers aux murs |
| `src/lib/map/layout.ts` | Plans alignés (enveloppe commune de la maison) |
| `src/lib/map/edits.ts` | Personnalisation des pièces (overlay persisté) |
| `src/components/` | Interface (plan, dossier, filtre, propriétés) |
| `src/routes/parametres/` | Pages de réglages |

## Principes (fiche façade)

- Maison **immense**, assez de pièces pour s’y perdre
- **Formes irrégulières** : tourelle, baies, ailes décalées — murs **partagés** d’un étage à l’autre
- **Fondations de pierre**, lambris **vert** (camouflage dans la verdure)
- Styles mêlés : rural, médiéval, grimoire, années 2000 — plus le victorien de la structure
