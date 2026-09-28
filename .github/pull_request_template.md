## Ce que fait cette PR


## Pourquoi


## Comment tester


## Checklist
- [ ] Branche a jour avec `main` (`git fetch origin && git rebase origin/main`)
- [ ] Titre de la PR au format des commits (`feat: ...`) : en squash, il devient le message du commit sur `main`
- [ ] Rien de pas fini n'est actif : `main` doit rester livrable
- [ ] `/code-review` passe en local, remarques traitees
- [ ] Si feature spec-kit : `specs/<feature>/` a jour et `/speckit-converge` ne signale plus d'ecart
- [ ] `pnpm -r lint` et `pnpm -r test` passent en local
- [ ] Pas de secret / `.env` / cle API dans le diff
- [ ] J'ai relu le diff moi-meme avant de demander une review

## Points laisses de cote
<!-- Ce que la review locale a signale et qu'on a decide de ne pas corriger,
     avec la raison. L'autre n'a pas le contexte de votre session. -->


<!--
Rappel : une PR = un sujet. Si le diff touche 15 fichiers pour 3 raisons
differentes, la review de l'autre devient inutilisable.
-->
