# Map Interactive

Application cartographique interactive : explorez, annotez et naviguez sur des
cartes avec une expérience fluide et moderne.

Créée avec [OnSpace](https://onspace.ai) (agent Grok), déployée sur Vercel par
la plateforme, avec une vitrine sur GitHub Pages.

## Stack

- **JavaScript** (application Vite)
- Déploiement app : **Vercel** (automatique, géré par la plateforme)
- Vitrine : **GitHub Pages** (workflow `jekyll-gh-pages.yml`)

## Structure du dépôt

| Chemin | Rôle |
|---|---|
| `src/` | Code source de l'application |
| `.data/` | Données de l'application |
| `.grok/` | Mémoire de projet, compétences et références de l'agent |
| `.github/workflows/` | Automatisations (déploiement GitHub Pages) |
| `index.html` | Page d'accueil (vitrine GitHub Pages) |

## Développement

```bash
npm install
npm run dev      # serveur de développement (port 8080)
npm run build    # build de production
```

## Notes

- Le build doit rester compatible Vercel (voir `.grok/references/deploy-target.md`).
- La mémoire de projet de l'agent vit dans `.grok/` — ne pas supprimer.
