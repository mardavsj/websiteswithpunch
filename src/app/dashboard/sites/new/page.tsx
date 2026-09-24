import { redirect } from "next/navigation";

/** Legacy route — Add site is a dashboard modal now. */
export default function NewSitePage() {
  redirect("/dashboard");
}
