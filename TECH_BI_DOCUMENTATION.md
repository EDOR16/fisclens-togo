# Documentation Technique — Module BI & Data Analyse
## FiscLens Togo — v1.1

---

## 📋 Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                   WORKSPACE BI (Frontend)                   │
│  - Page: /app/(app)/workspace-bi/page.tsx                   │
│  - Tabs: Overview, Sales, Clients, Purchases, Profitability │
│  - Import: Excel files → API                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (/api/v1/bi/)                   │
│                                                              │
│  Import Endpoints:                                          │
│  - POST /import/sales → validateSalesImport()              │
│  - POST /import/purchases → validatePurchasesImport()      │
│  - POST /import/clients → validateClientsImport()          │
│  - POST /import/products → validateProductsImport()        │
│                                                              │
│  Dashboard Endpoints:                                       │
│  - GET /dashboard/overview → calculateGlobalKPIs()         │
│  - GET /dashboard/sales → getTopProducts() + zones         │
│  - GET /dashboard/clients → getRFMSegmentation()           │
│  - GET /dashboard/purchases → getTopSuppliers()            │
│  - GET /dashboard/profitability → getProfitabilityByCategory() │
│  - GET /dashboard/forecast → forecastCA(), forecastTreasury() │
│  - GET /dashboard/alerts → Generate + list alerts          │
│                                                              │
│  Utils Endpoints:                                           │
│  - GET /reconciliation → Compare BI vs Accounts 701/601    │
│  - POST /alerts/:id/acknowledge → Mark alert as read       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Queries
┌─────────────────────────────────────────────────────────────┐
│             BUSINESS LOGIC LAYER (lib/bi/)                  │
│                                                              │
│  - excel-import.ts: Validation & parsing (4 templates)     │
│  - aggregates.ts: KPIs, top products, RFM, segments        │
│  - forecasting.ts: Predictions, MAPE, what-if scenarios    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ ORM Calls
┌─────────────────────────────────────────────────────────────┐
│                    PRISMA / DATABASE                        │
│                                                              │
│  Models:                                                    │
│  - ProductRef: Référence produits (code unique par tenant) │
│  - ClientRef: Référence clients                            │
│  - Sale: Détail des ventes                                 │
│  - Purchase: Détail des achats                             │
│  - Forecast: Prévisions stockées                           │
│  - Alert: Alertes générées                                 │
│  - Ecriture/EcritureLine: Données comptables               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Modèles de Données (Prisma)

### ProductRef
```prisma
model ProductRef {
  id           String   @id @default(cuid())
  tenantId     String
  code         String   // Code unique par tenant
  designation  String
  category     String   // Pour regrouper dans analyses
  priceVentHT  Int      // Prix vente HT en FCFA entiers
  costAchatHT  Int      // Coût d'achat
  margineCible Int      // Marge cible %
  
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  sales        Sale[]
  purchases    Purchase[]
  
  @@unique([tenantId, code])
  @@index([tenantId])
}
```

### Sale
```prisma
model Sale {
  id           String   @id @default(cuid())
  tenantId     String
  date         String   // YYYY-MM-DD
  refFacture   String   // Référence facture unique
  clientId     String   // FK ClientRef
  productId    String   // FK ProductRef
  quantity     Int
  puHT         Int
  montantHT    Int
  tauxTVA      Int      // %
  montantTVA   Int
  montantTTC   Int
  
  tenant       Tenant   @relation(fields: [tenantId])
  client       ClientRef @relation(fields: [clientId])
  product      ProductRef @relation(fields: [productId])
  
  @@index([tenantId, date])
  @@index([clientId])
  @@index([productId])
}
```

### Forecast
```prisma
model Forecast {
  id          String   @id @default(cuid())
  tenantId    String
  type        String   // CA | TRESORERIE | VENTE_PRODUIT
  date        String   // Date de la prévision
  value       Int      // Valeur en FCFA
  lowerBound  Int      // Intervalle -95%
  upperBound  Int      // Intervalle +95%
  mape        Int      // Erreur moyenne %
  metadata    String?  // JSON {"productId": "...", "horizon": 30}
  
  tenant      Tenant   @relation(fields: [tenantId])
  
  @@index([tenantId, type, date])
}
```

### Alert
```prisma
model Alert {
  id          String   @id @default(cuid())
  tenantId    String
  type        String   // VENTE_CHUTE | MARGE_NEG | ENCOURS_DEPASSE | ECART_COMPTA
  severity    String   // INFO | WARNING | CRITICAL
  title       String
  message     String
  acknowledged Boolean  @default(false)
  metadata    String?  // JSON pour contexte
  
  tenant      Tenant   @relation(fields: [tenantId])
  
  @@index([tenantId, createdAt])
}
```

---

## 🔌 Endpoints API - Détails

### 1. Import Ventes
**POST** `/api/v1/bi/import/sales`

**Request:**
```json
{
  "fileBuffer": "UEsDBBQABgAI...",  // Base64 Excel
  "fileName": "ventes.xlsx"
}
```

**Validations:**
1. Colonnes obligatoires présentes
2. Date format YYYY-MM-DD valide
3. Tous nombres ≥ 0
4. TVA cohérent : `|HT × Taux% - TVA| ≤ 1 FCFA`
5. TTC cohérent : `|HT + TVA - TTC| ≤ 1 FCFA`
6. Pas de doublon refFacture

**Response (succès):**
```json
{
  "success": true,
  "message": "15 ventes importées",
  "imported": [
    {
      "id": "cuid-123",
      "date": "2026-08-15",
      "refFacture": "FAC-001",
      "montantTTC": 59000
    }
  ]
}
```

**Response (erreur):**
```json
{
  "success": false,
  "message": "Validation échouée",
  "summary": {
    "total": 20,
    "valid": 15,
    "rejected": 5
  },
  "errors": [
    {
      "row": 3,
      "reason": "Colonne obligatoire manquante: quantité"
    },
    {
      "row": 7,
      "reason": "Date invalide: 2026-13-45 (format attendu: YYYY-MM-DD)"
    },
    {
      "row": 12,
      "reason": "Incohérence TVA: HT 50000 × 18% ≠ 8000"
    }
  ]
}
```

---

### 2. Réconciliation Comptable
**GET** `/api/v1/bi/reconciliation?threshold=5`

**Processus:**
1. Récupère `Σ Sale.montantTTC` → **salesBI**
2. Récupère `Σ Purchase.montantTTC` → **purchasesBI**
3. Récupère solde compte 701 (ventes) → **account701**
4. Récupère solde compte 601 (achats) → **account601**
5. Calcule écarts absolus
6. Compare à seuil (5% par défaut)
7. Génère alertes si écart > seuil

**Response:**
```json
{
  "success": true,  // false si alertes détectées
  "data": {
    "salesBI": 5000000,
    "purchasesBI": 3000000,
    "account701": 4950000,
    "account601": 3050000,
    "discrepancySales": 50000,
    "discrepancyPurchases": 50000,
    "alerts": [
      {
        "type": "ECART_COMPTA",
        "severity": "CRITICAL",
        "message": "Écart CA: BI 5M vs 701 4.95M (écart 50k)"
      }
    ]
  }
}
```

---

### 3. Dashboard Overview
**GET** `/api/v1/bi/dashboard/overview`

**Calculs:**
- CA = `Σ Sale.montantHT`
- Marge brute = CA − Σ coûts achat
- Marge % = (Marge brute / CA) × 100
- Trésorerie = `Σ Sale.montantTTC`
- Clients actifs = nombre clients distincts ayant une vente
- Tendance = % variation vs N-1 (à implémenter avec données historiques)

**Response:**
```json
{
  "success": true,
  "data": {
    "ca": 10000000,
    "margeBrute": 3500000,
    "margePercent": 35,
    "trésorerie": 11800000,
    "clientsActifs": 42,
    "tendanceVsN1": 12
  }
}
```

---

### 4. Dashboard Ventes
**GET** `/api/v1/bi/dashboard/sales`

**Données retournées:**
1. **topProducts** (limit 10)
   - Triés par `marge DESC`
   - Champs: code, designation, volume, ca, marge, margePercent

2. **zones**
   - Agrégé par `client.zoneGeo`
   - Champs: zone, ca

3. **seasonality** (12 derniers mois)
   - Agrégé par mois (`date.substring(0, 7)`)
   - Champs: month, ca

4. **bcgMatrix** (matrice BCG Boston)
   - Quadrants:
     - *Star*: volume > 100 ET marge% > 20
     - *Cash Cow*: volume > 100 ET marge% ≤ 20
     - *Question Mark*: volume ≤ 100 ET marge% > 20
     - *Dog*: volume ≤ 100 ET marge% ≤ 20

---

### 5. Dashboard Clients (RFM)
**GET** `/api/v1/bi/dashboard/clients`

**Segmentation RFM:**
- **R** (Recency) = jours depuis dernière vente
- **F** (Frequency) = nombre total de ventes
- **M** (Monetary) = CA total

**Scoring simple:**
- *VIP*: Frequency ≥ 10 ET Recency ≤ 30j
- *At Risk*: Frequency < 3 ET Recency > 90j
- *High Value*: Monetary > 10M FCFA
- *Normal*: Autres

**Response:**
```json
{
  "success": true,
  "data": {
    "rfmSegmentation": [
      {
        "clientCode": "CLI-001",
        "clientName": "Boutique ABC",
        "recency": 5,
        "frequency": 25,
        "monetary": 15000000,
        "rfmScore": "VIP"
      }
    ],
    "topClients": [
      {
        "clientCode": "CLI-001",
        "clientName": "Boutique ABC",
        "ca": 15000000,
        "weight": 35
      }
    ],
    "rfmDistribution": [
      {"segment": "VIP", "count": 8, "percentage": 19},
      {"segment": "Normal", "count": 28, "percentage": 67}
    ],
    "atRiskClients": [
      {
        "clientCode": "CLI-042",
        "clientName": "Boutique XYZ",
        "recency": 120,
        "frequency": 2,
        "monetary": 500000,
        "rfmScore": "At Risk"
      }
    ]
  }
}
```

---

## 📊 Algorithmes Clés

### MAPE (Mean Absolute Percentage Error)

```
MAPE = (1/n) × Σ |actual - predicted| / |actual|  × 100%
```

**Seuil acceptable:** < 15% sur 30 jours

### Prévisions CA (Moving Average)

1. Extraire sales.montantHT des 90 derniers jours
2. Calculer moyenne mobile 7j : `MA = avg(values[i-6:i])`
3. Écart-type : `σ = sqrt(variance(values))`
4. Intervalle 95% : `[MA - 1.96σ, MA + 1.96σ]`
5. Prévisions : CA futur ≈ MA (supposition stationnarité)

### Trésorerie 90j

```
Treasury(t) = Current Balance + Σ Sales Forecast(t) − Coûts variables
```

Où coûts variables sont simplifiés (à améliorer avec coûts réels).

### Point Mort (Seuil Rentabilité)

```
BE = Fixed Costs / (Contribution Margin %)

Où:
- Fixed Costs ≈ 10% × CA (estimation conservatrice)
- Contribution Margin = (CA − Coûts Variables) / CA
```

---

## 🚨 Système d'Alertes

Alertes générées automatiquement par `/dashboard/alerts` :

### Type: VENTE_CHUTE
**Déclencheur:** Volume 30j < Volume 60j × 0.7
```
Si previous_volume > 0:
   change% = (current - previous) / previous × 100
   If change% < -30: alert CRITICAL
```

### Type: MARGE_NEG
**Déclencheur:** `costAchatHT > priceVentHT`

### Type: ENCOURS_DEPASSE
**Déclencheur:** Client CA total > encours_autorisé

### Type: ECART_COMPTA
**Déclencheur:** `|BI - Compte 701/601| > threshold%`

### Type: STOCK_LENT
**Déclencheur:** Produit avec < 5 mouvements en 90j (non implémenté v1)

---

## 🧪 Tests

Voir `/tests/bi-module.test.ts` pour :
- ✅ Import validations (TVA, TTC, doublons)
- ✅ RFM scoring
- ✅ Alert generation
- ✅ Reconciliation detection

**Exécuter:**
```bash
npm run test  # Tous les tests
npm run test:watch  # Mode watch
```

---

## 🔧 Next Steps (v2)

1. **API publique** (webhooks pour données temps réel)
2. **Prévisions ARIMA** (modèle plus sophistiqué que MA)
3. **Alertes en temps réel** (socket.io)
4. **Export rapports** (PDF avec logos, signatures)
5. **Intégration ERP** (connexion bases externes)
6. **ML anomaly detection** (détection auto d'écarts comptables)

---

## 📞 Développeur - Support

- **Questions Prisma** : voir `prisma/schema.prisma`
- **Questions API** : voir endpoints ci-dessus
- **Dépannage** : activer debug `DEBUG=fiscLens:*` en .env

---

**Dernière maj** : 2026-08-17
