# Guide Utilisateur — Workspace BI & Data Analyse
## FiscLens Togo — v1.1

---

## 🎯 Qu'est-ce que le Workspace BI?

Le **Workspace BI** (Business Intelligence) est un espace d'analyse dédié aux **data analystes** et **gestionnaires** de FiscLens. Il permet de :

- **Importer vos données opérationnelles** depuis Excel (ventes, achats, clients, produits)
- **Visualiser les performances** de votre entreprise en temps réel
- **Générer des prévisions** précises pour anticiper les évolutions
- **Détecter automatiquement les anomalies** et risques
- **Prendre des décisions éclairées** basées sur des données fiables

---

## 📥 Étape 1 : Préparer vos fichiers Excel

Le Workspace BI accepte **4 templates Excel normalisés**. Préparez vos fichiers selon ce format exact :

### 1️⃣ **ventes.xlsx**

| Colonne | Type | Exemple | Description |
|---|---|---|---|
| `date` | Date | 2026-08-15 | Format YYYY-MM-DD |
| `refFacture` | Texte | FAC-2026-001 | Référence unique facture |
| `codeClient` | Texte | CLI-001 | Code client (doit exister dans `clients.xlsx`) |
| `codeProduit` | Texte | PROD-A1 | Code produit (doit exister dans `produits.xlsx`) |
| `quantité` | Nombre | 5 | Nombre d'unités vendues |
| `puHT` | Nombre | 10000 | Prix unitaire HT en FCFA |
| `montantHT` | Nombre | 50000 | Total HT = quantité × puHT |
| `tauxTVA` | Nombre | 18 | Taux TVA en % |
| `montantTVA` | Nombre | 9000 | TVA = montantHT × tauxTVA / 100 |
| `montantTTC` | Nombre | 59000 | Total TTC = HT + TVA |

**✓ Validation** : Cohérence automatique des montants TVA et TTC.

### 2️⃣ **achats.xlsx**

| Colonne | Type | Exemple |
|---|---|---|
| `date` | Date | 2026-08-14 |
| `refCommande` | Texte | CMD-2026-045 |
| `codeFournisseur` | Texte | FOURN-SARL |
| `codeArticle` | Texte | PROD-A1 |
| `quantité` | Nombre | 50 |
| `puHT` | Nombre | 6000 |
| `montantHT` | Nombre | 300000 |
| `tauxTVA` | Nombre | 18 |
| `montantTVA` | Nombre | 54000 |
| `montantTTC` | Nombre | 354000 |

**✓ Validation** : Idem ventes (cohérence HT/TVA/TTC).

### 3️⃣ **clients.xlsx**

| Colonne | Type | Exemple | Description |
|---|---|---|---|
| `code` | Texte | CLI-001 | Identifiant unique |
| `nom` | Texte | Boutique Mohamed | Nom de l'entreprise/personne |
| `segment` | Texte | VIP | VIP / Normal / Petits |
| `zoneGeo` | Texte | Lomé | Ville/région (Lomé, Kara, Agoe, etc.) |
| `encours_autorisé` | Nombre | 5000000 | Plafond de crédit en FCFA |

**✓ Validation** : Unicité des codes clients.

### 4️⃣ **produits.xlsx**

| Colonne | Type | Exemple | Description |
|---|---|---|---|
| `code` | Texte | PROD-A1 | Identifiant unique |
| `désignation` | Texte | Téléphone Samsung | Nom du produit |
| `catégorie` | Texte | Électronique | Catégorie pour analyse |
| `prixVenteHT` | Nombre | 100000 | Prix de vente unitaire HT |
| `coûtAchatHT` | Nombre | 60000 | Coût d'achat unitaire HT |
| `margeCible` | Nombre | 40 | Marge cible en % |

**✓ Validation** : Unicité des codes produits, valeurs positives.

---

## 📤 Étape 2 : Importer vos fichiers

1. Accédez au **Workspace BI** via le menu latéral (icône 📊)
2. Dans la zone **« Importer des données Excel »**, cliquez sur le bouton correspondant au fichier
3. Sélectionnez votre fichier `.xlsx`
4. Le système valide automatiquement :
   - ✅ Présence de toutes les colonnes obligatoires
   - ✅ Types de données (dates, nombres)
   - ✅ Cohérence arithmétique (HT × taux TVA = TVA, etc.)
   - ✅ Absence de doublons

### 📋 Rapport de rejet

Si des lignes sont rejetées, un rapport détaille **ligne par ligne** le motif du rejet :
- *Date invalide (format attendu: YYYY-MM-DD)*
- *Colonne obligatoire manquante: quantité*
- *Incohérence TVA: HT 50000 × 18% ≠ 8000*
- *Doublon détecté: facture FAC-2026-001*

**➜ Corriger le fichier et réessayer.**

---

## 📊 Étape 3 : Consulter les 7 dashboards

Une fois vos données importées, explorez les **7 vues analytiques** :

### 1️⃣ **Vue d'ensemble**
- **CA (Chiffre d'affaires)** : Total des ventes HT
- **Marge brute** : CA − coûts d'achat
- **Trésorerie** : Total des ventes TTC (argent reçu)
- **Clients actifs** : Nombre de clients ayant effectué au moins 1 vente
- **Tendance vs N-1** : Croissance/décroissance en %

### 2️⃣ **Ventes**
- **Top 10 produits** : Classés par volume **et** marge
- **Carte des zones** : Ventes par zone géographique (Lomé, Kara, Agoe…)
- **Saisonnalité 12 mois** : Détection des périodes fortes/faibles (récoltes, fêtes, rentrée)
- **Matrice BCG** : Positionnement produits (Star, Cash Cow, Question Mark, Dog)

### 3️⃣ **Clients**
- **Segmentation RFM** : Recency (date dernière vente), Frequency (nombre ventes), Monetary (CA total)
- **Pareto 80/20** : Top 20 clients générant 80% du CA
- **Score de risque** : Clients en risque (inactifs > 90j)
- **Relance automatique** : Alertes pour relancer les clients à risque

### 4️⃣ **Achats**
- **Top fournisseurs** : Classés par montant d'achat
- **Évolution des prix d'achat** : Tendance inflation/déflation par produit
- **Concentration** : Indice Herfindahl pour mesurer dépendance aux fournisseurs
  - *Élevée* : Risque (1-2 fournisseurs seulement)
  - *Moyenne* : À surveiller
  - *Faible* : Équilibré ✓

### 5️⃣ **Rentabilité**
- **Marges par produit** : Tous les produits avec marge % et absolue
- **Marges par catégorie** : Analyse par groupes (Électronique, Textile, etc.)
- **Point mort (seuil de rentabilité)** : CA minimum nécessaire pour couvrir les frais fixes

### 6️⃣ **Prévisions**
- **CA projeté 30 jours** : Tendance futur chiffre d'affaires (intervalle de confiance 95%)
- **Trésorerie 90 jours** : Projection argent disponible + date point d'équilibre
- **Précision MAPE** : Erreur moyenne en % (< 15% = bon ✓)
- **Simulateur What-if** : Tester scénarios
  - *« +10% volume »* → impact CA
  - *« -5% prix »* → impact marge
  - *« -15% churn »* → perte 15% clients

### 7️⃣ **Alertes**
Détection automatique d'**anomalies à action immédiate** :

| Alerte | Déclencheur | Sévérité | Action |
|---|---|---|---|
| **Chute de ventes** | Produit -30% volume vs période précédente | 🔴 CRITICAL | Revoir stratégie produit |
| **Marge négative** | Coût d'achat > prix de vente | 🟡 WARNING | Augmenter prix ou réduire coûts |
| **Encours dépassé** | Client dépasse plafond de crédit | 🟡 WARNING | Bloquer nouvelles ventes / Relancer |
| **Écart comptabilité** | BI ≠ Compte 701 (ventes) ou 601 (achats) | 🔴 CRITICAL | Réconcilier données |
| **Stock lent** | Produit avec peu de mouvements | ℹ️ INFO | Promotion ou déstockage |

**➜ Acquitter les alertes** une fois traitées en cliquant « Acquitter ».

---

## 🔄 Étape 4 : Réconciliation comptable

Une fonctionnalité automatique vérifie la **cohérence BI ↔ Comptabilité** :

- **CA BI** (somme ventes.xlsx) vs **Compte 701** (comptabilité générale)
- **Achats BI** vs **Compte 601**

**Si écart > 5%** : Alerte critique générée.

✅ **Bonne pratique** : Importer régulièrement (hebdomadaire) pour détecter les incohérences tôt.

---

## 💡 Cas d'usage typique

### Directeur général qui veut comprendre son activité en 10 minutes

1. Importer `ventes.xlsx`, `achats.xlsx`, `clients.xlsx`, `produits.xlsx`
2. Consulter **Vue d'ensemble** → CA, marge, clients actifs
3. Consulter **Clients** → Pareto + score de risque → Identifier top clients + clients à relancer
4. Consulter **Prévisions** → CA 30j + trésorerie 90j → Anticiper besoins de financement
5. Consulter **Alertes** → Traiter anomalies (marge négative, encours)

**Temps total : 10-15 minutes → Décisions éclairées ✓**

---

## ⚠️ Erreurs courantes

| Erreur | Cause | Correction |
|---|---|---|
| *Fichier non accepté* | Format incorrect (`.csv` au lieu de `.xlsx`) | Utiliser Excel → **Enregistrer sous** `.xlsx` |
| *Colonne manquante* | En-têtes différents (ex: « Facture » vs « refFacture ») | Renommer exactement comme indiqué dans les templates |
| *Incohérence TVA* | Montant TVA arrondi différemment | Formule Excel : `=ROUND(HT*Taux/100, 0)` |
| *Doublon détecté* | Même référence facture/commande en 2 lignes | Vérifier et corriger les références |
| *Code client/produit manquant* | Ventes Excel font référence à code qui n'existe pas dans clients/produits | D'abord importer `clients.xlsx` et `produits.xlsx`, puis les ventes/achats |

---

## 🔐 Sécurité & Archivage

- Tous les imports sont **tracés dans les logs d'audit**
- Les données BI sont **archivées 10 ans** (conforme LPF Togo)
- Accès limité selon le rôle :
  - **GERANT** : Accès complet
  - **COMPTABLE** : Lectures ventes/achats/alertes
  - **LECTURE** : Dashboards en lecture seule
  - **CABINET** : Tous dossiers clients

---

## 📞 Support

Pour toute question :
- Consulter la **documentation en ligne** : [lien]
- Contacter le **support FiscLens** : support@fiscLens.tg
- Voir le tutoriel vidéo **Épisode 2** : Data Analyse pour DG (sous-titres FR)

---

**Bon analyse ! 📊**
