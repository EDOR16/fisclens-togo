/**
 * Dictionnaire bilingue FR / EN — FiscLens Togo
 * Règle : les références légales [CGI art. 74], [SYSCOHADA], [OTR], codes
 * de comptes et montants FCFA ne se traduisent JAMAIS — ce sont des noms propres.
 */

export type Lang = "fr" | "en";

export const DICT = {
  fr: {
    // ── Navigation ──────────────────────────────────────────────
    nav_workspace:    "Espace de travail",
    nav_demo:         "Démo",
    nav_docs:         "Documentation",
    // ── Landing ─────────────────────────────────────────────────
    h1:               "Chaque chiffre a sa loi.",
    sub:              "Comptabilité SYSCOHADA, TVA 18 %, IS 27 % vs IMF — FiscLens Togo calcule, cite l'article, et prépare vos déclarations OTR.",
    cta_create:       "Créer mon espace",
    cta_proof:        "Voir un calcul sourcé",
    no_sim:           "Environnement de travail réel — aucune donnée simulée",
    // ── Login ───────────────────────────────────────────────────
    h1_login:         "Votre grand livre vous attend.",
    login_title:      "Connexion",
    login_sub:        "Accédez à votre espace comptable et fiscal",
    login_submit:     "Se connecter",
    forgot:           "Mot de passe oublié ?",
    no_account:       "Pas encore de compte ?",
    create:           "Créer un compte",
    totp:             "Code 2FA (application d'authentification)",
    login_2fa_hint:   "Compte protégé : saisissez votre code temporaire.",
    login_error:      "Email ou mot de passe incorrect.",
    // ── Register ────────────────────────────────────────────────
    h1_register:      "Ouvrez votre grand livre.",
    create_account:   "Créer un compte",
    tenant_ready:     "Tenant prêt à l'emploi",
    company:          "Nom de l'entreprise",
    email:            "Email professionnel",
    regime:           "Régime fiscal",
    regime_ph:        "Sélectionnez votre régime",
    regime_1:         "Réel Normal — PME structurée",
    regime_2:         "Régime Simplifié (RSI)",
    regime_3:         "TPU — indépendant / TPE",
    password:         "Mot de passe",
    confirm:          "Confirmer le mot de passe",
    cgu:              "J'accepte les Conditions Générales d'Utilisation",
    privacy:          "J'accepte la politique de confidentialité",
    submit:           "Créer mon compte",
    login_link:       "Déjà un compte ? Se connecter",
    provisioned_ok:   "Espace provisionné.",
    provisioned_desc: "Plan SYSCOHADA seedé · 6 journaux · exercice ouvert · calendrier généré selon votre régime.",
    connect_cta:      "Se connecter",
    // ── Simulateur ──────────────────────────────────────────────
    ca_monthly:       "CA mensuel HT (FCFA)",
    margin:           "Marge estimée",
    vat:              "TVA collectée (18 %)",
    cit:              "IS estimé (27 %)",
    imf:              "IMF min. 200 000 FCFA (1 % du CA)",
    due:              "Impôt dû — règle max(IS, IMF)",
    next_deadline:    "Prochaine échéance",
    estimate:         "Estimation instantanée. Dans votre espace, le moteur applique les règles exactes : prorata, déductions, barème progressif [CGI art. 74], arrondis réglementaires.",
    // ── Exports ─────────────────────────────────────────────────
    export_pdf:       "Exporter PDF",
    export_excel:     "Exporter Excel",
    export_pdf_title: "Télécharger en PDF",
    export_xl_title:  "Télécharger en Excel",
    // ── Paie / IRPP ─────────────────────────────────────────────
    payroll_brut:     "Salaire Brut",
    cnss_sal:         "CNSS Salarié (4 %)",
    amu_sal:          "AMU Salarié (5 %)",
    cnss_pat:         "CNSS Patronal (15 %)",
    amu_pat:          "AMU Patronal (5 %)",
    total_retenues:   "Total retenues salariales (9 %)",
    total_charges:    "Total charges patronales (20 %)",
    irpp_base:        "Base IRPP après abattement 28 %",
    irpp_due:         "IRPP retenu à la source",
    net_pay:          "Net à payer",
    // ── Thème ───────────────────────────────────────────────────
    theme_paper:      "Papier",
    theme_ink:        "Encre",
  },
  en: {
    // ── Navigation ──────────────────────────────────────────────
    nav_workspace:    "Workspace",
    nav_demo:         "Demo",
    nav_docs:         "Documentation",
    // ── Landing ─────────────────────────────────────────────────
    h1:               "Every figure has its law.",
    sub:              "SYSCOHADA accounting, 18 % VAT, 27 % CIT vs IMF — FiscLens Togo computes, cites the article, and prepares your OTR filings.",
    cta_create:       "Create my workspace",
    cta_proof:        "See a sourced calculation",
    no_sim:           "Real working environment — no simulated data",
    // ── Login ───────────────────────────────────────────────────
    h1_login:         "Your ledger awaits.",
    login_title:      "Sign in",
    login_sub:        "Access your accounting & tax workspace",
    login_submit:     "Sign in",
    forgot:           "Forgot password?",
    no_account:       "No account yet?",
    create:           "Create an account",
    totp:             "2FA code (authenticator app)",
    login_2fa_hint:   "Protected account: enter your temporary code.",
    login_error:      "Incorrect email or password.",
    // ── Register ────────────────────────────────────────────────
    h1_register:      "Open your ledger.",
    create_account:   "Create an account",
    tenant_ready:     "Ready-to-use tenant",
    company:          "Company name",
    email:            "Business email",
    regime:           "Tax regime",
    regime_ph:        "Select your regime",
    regime_1:         "Real Normal — structured SME",
    regime_2:         "Simplified regime (RSI)",
    regime_3:         "TPU — self-employed / micro",
    password:         "Password",
    confirm:          "Confirm password",
    cgu:              "I accept the Terms of Service",
    privacy:          "I accept the Privacy Policy",
    submit:           "Create my account",
    login_link:       "Already have an account? Sign in",
    provisioned_ok:   "Workspace provisioned.",
    provisioned_desc: "SYSCOHADA chart seeded · 6 journals · fiscal year open · calendar generated for your regime.",
    connect_cta:      "Sign in",
    // ── Simulateur ──────────────────────────────────────────────
    ca_monthly:       "Monthly revenue excl. VAT (FCFA)",
    margin:           "Estimated margin",
    vat:              "VAT collected (18 %)",
    cit:              "Estimated corporate tax (27 %)",
    imf:              "Minimum flat tax IMF — min. 200 000 FCFA (1 % of revenue)",
    due:              "Tax due — max(CIT, IMF) rule",
    next_deadline:    "Next deadline",
    estimate:         "Instant estimate. In your workspace, the engine applies the exact rules: prorata, deductions, progressive scale [CGI art. 74], statutory rounding.",
    // ── Exports ─────────────────────────────────────────────────
    export_pdf:       "Export PDF",
    export_excel:     "Export Excel",
    export_pdf_title: "Download as PDF",
    export_xl_title:  "Download as Excel",
    // ── Paie / IRPP ─────────────────────────────────────────────
    payroll_brut:     "Gross Salary",
    cnss_sal:         "CNSS Employee (4 %)",
    amu_sal:          "AMU Employee (5 %)",
    cnss_pat:         "CNSS Employer (15 %)",
    amu_pat:          "AMU Employer (5 %)",
    total_retenues:   "Total employee deductions (9 %)",
    total_charges:    "Total employer contributions (20 %)",
    irpp_base:        "IRPP base after 28 % allowance",
    irpp_due:         "IRPP withheld at source",
    net_pay:          "Net pay",
    // ── Thème ───────────────────────────────────────────────────
    theme_paper:      "Paper",
    theme_ink:        "Ink",
  },
} as const;

export type DictKey = keyof typeof DICT.fr;
