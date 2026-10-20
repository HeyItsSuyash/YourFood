import { redirect } from "next/navigation";

export default function DrawRedirect() {
  redirect("/?tab=draw");
}