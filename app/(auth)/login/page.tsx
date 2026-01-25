"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/firebase/session-provider";
import { useActionState, useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client-config";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  // Handle guest login
  useEffect(() => {
    const isGuest = searchParams.get("isGuest");
    const guestEmail = searchParams.get("guestEmail");
    const guestPassword = searchParams.get("guestPassword");
    const redirectUrl = searchParams.get("redirectUrl") || "/";

    if (isGuest && guestEmail && guestPassword) {
      signInWithEmailAndPassword(auth, guestEmail, guestPassword)
        .then(() => {
          router.push(redirectUrl);
        })
        .catch((error) => {
          console.error("Guest sign in error:", error);
          toast({
            type: "error",
            description: "Failed to sign in as guest!",
          });
        });
    }
  }, [searchParams, router]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success" && state.idToken) {
      // Parse credentials and sign in with Firebase
      const credentials = JSON.parse(state.idToken);

      signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        .then(async () => {
          setIsSuccessful(true);
          await updateSession();
          router.push("/");
          router.refresh();
        })
        .catch((error) => {
          console.error("Firebase sign in error:", error);
          toast({
            type: "error",
            description: "Failed to sign in!",
          });
        });
    }
  }, [state.status, state.idToken]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
