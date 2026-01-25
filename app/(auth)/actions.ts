"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createFirebaseUser } from "@/lib/firebase/auth-helpers";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  idToken?: string;
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Return the validated credentials to be used on the client side
    // Firebase authentication happens on the client
    return {
      status: "success",
      idToken: JSON.stringify(validatedData)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
  idToken?: string;
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Create user in Firebase Auth and Firestore
    const result = await createFirebaseUser(
      validatedData.email,
      validatedData.password
    );

    if (!result.success) {
      // Check if user already exists
      if (result.error?.includes("already exists") || result.error?.includes("email-already-in-use")) {
        return { status: "user_exists" } as RegisterActionState;
      }
      return { status: "failed" } as RegisterActionState;
    }

    // Return success and credentials for client-side login
    return {
      status: "success",
      idToken: JSON.stringify(validatedData)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export const signOut = async () => {
  redirect("/login");
};
