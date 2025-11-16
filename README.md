# Les Petites Attentions

Landing page présentant le projet « Les Petites Attentions » avec une vidéo d'introduction
et un formulaire recueillant les témoignages des clients. Les réponses sont
persistées sur le serveur pour permettre l'analyse statistique des tranches d'âge et
situations familiales.

## Prérequis

- [Node.js](https://nodejs.org/) 18+ (aucune dépendance externe n'est nécessaire)
- Aucune variable d'environnement obligatoire. (Optionnel) `ALLOWED_ORIGIN` permet
  de restreindre les requêtes cross-origin si vous n'utilisez pas la valeur par
  défaut `*`.

## Démarrer le serveur

```bash
npm start
```

Par défaut, l'application est servie sur [http://localhost:3000](http://localhost:3000).

Le serveur répond également aux requêtes provenant d'un front-end hébergé sur un
autre domaine grâce aux en-têtes CORS. Si vous servez la page statique depuis un
hébergement tiers, assurez-vous simplement que l'URL de l'API pointe vers le
serveur Node lancé ci-dessus.

## API

### POST `/api/testimonials`

Enregistre un témoignage.

```json
{
  "ageRange": "26-35",
  "profession": "Entrepreneuse",
  "familySituation": "famille",
  "feeling": "Votre carte a touché toute la famille."
}
```

Réponse `201 Created` :

```json
{
  "message": "Merci pour votre témoignage !",
  "entry": {
    "id": "UUID",
    "ageRange": "26-35",
    "profession": "Entrepreneuse",
    "familySituation": "famille",
    "feeling": "...",
    "submittedAt": "2024-04-01T12:30:00.000Z"
  }
}
```

### GET `/api/stats`

Retourne le nombre total d'enregistrements ainsi qu'un regroupement par tranche d'âge
et situation de famille pour alimenter le tableau de bord présent sur la page.

```json
{
  "totalSubmissions": 5,
  "ageRanges": {
    "26-35": 3,
    "36-45": 2
  },
  "familySituations": {
    "couple": 2,
    "famille": 3
  }
}
```

Les données sont stockées dans `data/submissions.json`. Vous pouvez les supprimer en
vidant ce fichier si nécessaire.

## Dépannage

- **Formulaire dupliqué** : le script client force l'existence d'un seul
  formulaire avec l'identifiant `testimonial-form`. Si votre intégration
  additionne accidentellement plusieurs formulaires (ex. CMS, builder), les
  doublons seront automatiquement supprimés au chargement de la page.
- **Soumissions qui n'arrivent pas** : vérifiez que le serveur est démarré (`npm
  start`) et accessible depuis l'URL chargée par la page. Aucun fichier ou
  variable d'environnement supplémentaire n'est requis, la persistance est gérée
  automatiquement dans `data/submissions.json`.
