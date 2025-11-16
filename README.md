# Les Petites Attentions

Landing page présentant le projet « Les Petites Attentions » avec une vidéo d'introduction
et un formulaire recueillant les témoignages des clients. Les réponses sont
persistées sur le serveur pour permettre l'analyse statistique des tranches d'âge et
situations familiales.

## Prérequis

- [Node.js](https://nodejs.org/) 18+ (aucune dépendance externe n'est nécessaire)

## Démarrer le serveur

```bash
npm start
```

Par défaut, l'application est servie sur [http://localhost:3000](http://localhost:3000).

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
