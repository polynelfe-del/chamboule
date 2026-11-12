# Chamboule Android

L’APK contient les exercices, le carnet et les écrans Chamboule. Les rappels utilisent le planificateur Android et les données restent dans l’application. Le lien GitHub sert au téléchargement de l’APK. Le manifeste ne demande aucune permission Internet.

Sur Android 8 ou plus récent, ouvrir la cloche, toucher **Activer les notifications** et accepter la demande Android si elle apparaît. Les horaires par défaut sont 06:30 et 18:29. Sur Android 12 et plus récent, **Autoriser les horaires précis** ouvre l’accès système **Alarmes et rappels**. **Programmer un test** laisse 25 secondes pour fermer Chamboule et verrouiller le téléphone.

Pour transférer un carnet existant, exporter son fichier JSON dans l’ancienne version via **Réglages → Sauvegarde dans un fichier → Exporter**. Dans l’APK, ouvrir le même réglage, choisir **Importer**, sélectionner le fichier et confirmer le remplacement.

Le script `build.ps1` construit les écrans, prépare les ressources locales et compile l’APK avec le JDK 21 et les outils Android 35.0.1. Les chemins du dossier de travail sont regroupés au début du script. Pour chaque mise à jour, augmenter `VersionCode` et conserver le certificat privé déjà utilisé. Les clés de signature sont conservées séparément du dépôt et des fichiers à télécharger.
