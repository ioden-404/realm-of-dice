# Assistant exécutif - Espace de travail

Ce repo est l'espace de travail d'un assistant exécutif. Il centralise les skills, le contexte persistant et les projets en cours.

## `.claude/skills/`

Les skills Claude Code. Chaque skill occupe son propre sous-dossier avec un fichier `SKILL.md` qui décrit son déclenchement et son comportement. Le harness charge automatiquement chaque description : inutile de les lister ici. Pour créer une nouvelle skill, utiliser le plugin `/skill-creator`.

## `context/`

La mémoire de travail persistante. Deux fichiers :

- `context/me.md` : identité de l'utilisateur - rôle, structure, langues, timezone, sources de revenus, objectifs, terminologie perso. Ce fichier doit être consulté en début de conversation pour adapter le ton et les recommandations.
- `context/connectors.md` : registre des connecteurs (MCP, CLI) mis en place. Seuls les connecteurs listés dans ce fichier sont à utiliser. Tout nouveau connecteur doit y être enregistré avant utilisation.

## `projects/`

Les chantiers actifs. Un sous-dossier par projet. Chaque sous-dossier contient les notes, plans et livrables liés au projet en question.
