/**
 * /analyse → redirige vers /workspace-bi (module BI unifié)
 * Cette route était un placeholder "Phase 4" maintenant intégré dans workspace-bi.
 */
import { redirect } from "next/navigation";

export default function AnalysePage() {
  redirect("/workspace-bi");
}
