import { PrismaClient } from "@prisma/client";

export type Regime = "REEL_NORMAL" | "RSI" | "TPU";

interface CalendarRule {
  key: string;
  label: string;
  freq: "MENSUELLE" | "TRIMESTRIELLE" | "ANNUELLE";
  regimes: Regime[] | "TOUS";
  day?: number;
  month?: number;
  monthOffset?: number;
  legalRef: string;
  aParametrer?: boolean;
}

// Référentiel des échéances fiscales et sociales au Togo (Section 10 du CdC)
export const CALENDAR_RULES: CalendarRule[] = [
  {
    key: "TVA",
    label: "Déclaration & paiement TVA",
    freq: "MENSUELLE",
    regimes: ["REEL_NORMAL", "RSI"],
    day: 15,
    monthOffset: 1,
    legalRef: "CGI/LPF Togo — avant le 15 du mois suivant (Section 10)",
  },
  {
    key: "IRPP_SAL",
    label: "Reversement retenue à la source IRPP sur salaires",
    freq: "MENSUELLE",
    regimes: "TOUS",
    day: 15,
    monthOffset: 1,
    legalRef: "LPF Togo — avant le 15 du mois suivant (Section 10)",
  },
  {
    key: "CNSS",
    label: "Déclaration & versement cotisations CNSS / AMU",
    freq: "MENSUELLE",
    regimes: "TOUS",
    day: 15,
    monthOffset: 1,
    legalRef: "Code de la Sécurité Sociale Togo — avant le 15 du mois suivant",
  },
  {
    key: "PATENTE",
    label: "Paiement de la taxe professionnelle (Patente)",
    freq: "ANNUELLE",
    regimes: "TOUS",
    day: 31,
    month: 3,
    legalRef: "CGI Togo — avant le 31 mars (Section 10)",
  },
  {
    key: "DAS",
    label: "Déclaration annuelle récapitulative des salaires (DAS)",
    freq: "ANNUELLE",
    regimes: "TOUS",
    day: 31,
    month: 3,
    legalRef: "LPF Togo — avant le 31 mars (Section 10)",
  },
  {
    key: "LIASSE",
    label: "Déclaration annuelle de résultats & Liasse SYSCOHADA",
    freq: "ANNUELLE",
    regimes: ["REEL_NORMAL", "RSI"],
    day: 30,
    month: 4,
    legalRef: "CGI Togo — avant le 30 avril (Section 10)",
  },
  {
    key: "IS_ACC1",
    label: "1er acompte provisionnel Impôt sur les Sociétés (IS)",
    freq: "ANNUELLE",
    regimes: ["REEL_NORMAL"],
    day: 30,
    month: 6,
    legalRef: "CGI Togo — avant le 30 juin (Section 10)",
  },
  {
    key: "IS_ACC2",
    label: "2ème acompte provisionnel Impôt sur les Sociétés (IS)",
    freq: "ANNUELLE",
    regimes: ["REEL_NORMAL"],
    day: 30,
    month: 9,
    legalRef: "CGI Togo — avant le 30 septembre (Section 10)",
  },
  {
    key: "TPU_FR",
    label: "Fractions trimestrielles Taxe Professionnelle Unique (TPU)",
    freq: "TRIMESTRIELLE",
    regimes: ["TPU"],
    legalRef: "CGI Togo consolidé — fin de chaque trimestre (Section 6.5)",
    aParametrer: true,
  },
];

const MOIS_NOMS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export async function generateCalendar(
  tx: any,
  tenantId: string,
  regime: Regime,
  year: number
) {
  const rows: Array<{
    tenantId: string;
    key: string;
    label: string;
    regime: string;
    freq: string;
    dueDate: string;
    legalRef: string;
    status: string;
  }> = [];

  const applicableRules = CALENDAR_RULES.filter(
    (r) => r.regimes === "TOUS" || (r.regimes as Regime[]).includes(regime)
  );

  for (const r of applicableRules) {
    if (r.freq === "MENSUELLE") {
      // 12 échéances mensuelles pour l'année : période m -> exigible le 15 du mois m+1
      for (let m = 0; m < 12; m++) {
        const dueMonth = m + 1; // 1 to 12
        const dueYear = dueMonth > 12 ? year + 1 : year;
        const normalizedMonth = dueMonth > 12 ? 1 : dueMonth;
        const dueDateStr = `${dueYear}-${String(normalizedMonth).padStart(2, "0")}-${String(r.day || 15).padStart(2, "0")}`;

        rows.push({
          tenantId,
          regime,
          freq: r.freq,
          legalRef: r.legalRef,
          key: `${r.key}-${year}-${String(m + 1).padStart(2, "0")}`,
          label: `${r.label} — ${MOIS_NOMS[m]} ${year}`,
          dueDate: dueDateStr,
          status: "A_JOUR",
        });
      }
    } else if (r.freq === "ANNUELLE") {
      const monthNum = r.month || 3;
      const dayNum = r.day || 31;
      const dueDateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      rows.push({
        tenantId,
        regime,
        freq: r.freq,
        legalRef: r.legalRef,
        key: `${r.key}-${year}`,
        label: `${r.label} — Exercice ${year}`,
        dueDate: dueDateStr,
        status: "A_JOUR",
      });
    } else if (r.freq === "TRIMESTRIELLE") {
      // 4 trimestres (TPU)
      const quarters = [
        { q: 1, endMonth: "03-31" },
        { q: 2, endMonth: "06-30" },
        { q: 3, endMonth: "09-30" },
        { q: 4, endMonth: "12-31" },
      ];

      for (const q of quarters) {
        rows.push({
          tenantId,
          regime,
          freq: r.freq,
          legalRef: r.legalRef,
          key: `${r.key}-${year}-T${q.q}`,
          label: `${r.label} — T${q.q} ${year}`,
          dueDate: `${year}-${q.endMonth}`,
          status: "A_PARAMETRER",
        });
      }
    }
  }

  for (const row of rows) {
    await tx.calendarObligation.upsert({
      where: {
        tenantId_key_dueDate: {
          tenantId: row.tenantId,
          key: row.key,
          dueDate: row.dueDate,
        },
      },
      update: { label: row.label, status: row.status },
      create: row,
    });
  }
}
