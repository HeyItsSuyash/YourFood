import { redirect } from "next/navigation";

export default function PuzzleRedirect() {
  redirect("/?tab=puzzle");
}