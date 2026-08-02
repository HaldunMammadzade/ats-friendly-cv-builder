"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, safeNextPath } from "@/lib/auth/site-url";

export interface AuthState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const emailField = z.email({ error: "Enter a valid email address." });

const passwordField = z
  .string()
  .min(8, { error: "At least 8 characters." })
  .max(72, { error: "Passwords are capped at 72 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Enter your password." }),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Enter your full name." }).max(80),
  email: emailField,
  password: passwordField,
});

function invalid(error: z.ZodError): AuthState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { fieldErrors };
}

export async function signInWithPassword(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase deliberately returns the same message for a wrong password and
    // an unknown account; don't leak which it was.
    return { error: "Email or password is incorrect." };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signUpWithPassword(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // With email confirmation on, no session is returned yet.
  if (!data.session) {
    return {
      message:
        "Check your inbox — we sent a confirmation link. It expires in an hour.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithMagicLink(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = emailField.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) return { error: error.message };

  return {
    message: `Magic link sent to ${parsed.data}. Open it on this device to stay signed in.`,
  };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const next = safeNextPath(formData.get("next")?.toString());

  const redirectTo = new URL("/auth/callback", siteUrl);
  if (next !== "/dashboard") {
    redirectTo.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }

  redirect(data.url);
}

export async function requestPasswordReset(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = emailField.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  // Always report success so this can't be used to enumerate accounts.
  return {
    message:
      "If an account exists for that address, a reset link is on its way.",
  };
}

export async function updatePassword(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirmPassword")?.toString() ?? "";

  const parsed = passwordField.safeParse(password);
  if (!parsed.success) {
    return { fieldErrors: { password: parsed.error.issues.map((i) => i.message) } };
  }
  if (password !== confirm) {
    return { fieldErrors: { confirmPassword: ["Passwords do not match."] } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

const profileSchema = z.object({
  fullName: z.string().trim().max(80).default(""),
  headline: z.string().trim().max(160).default(""),
});

export async function updateProfile(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    headline: formData.get("headline"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      headline: parsed.data.headline,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { message: "Profile saved." };
}
