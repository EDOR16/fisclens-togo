import { redirect } from "next/navigation";

/** Page racine → redirige vers le dashboard si connecté, sinon login */
export default function RootPage() {
  redirect("/dashboard");
}
