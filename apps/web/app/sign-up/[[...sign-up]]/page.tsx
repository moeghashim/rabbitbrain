import { redirect } from "next/navigation";

export default function SignUpPage() {
	redirect("/auth/popup-start?redirect_url=%2Fapp");
}
