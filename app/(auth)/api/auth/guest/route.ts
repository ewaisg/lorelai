import { NextResponse } from "next/server";
import { createGuestFirebaseUser } from "@/lib/firebase/auth-helpers";
import { getServerSession } from "@/lib/firebase/auth-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get("redirectUrl") || "/";

    // Check if user is already authenticated
    const session = await getServerSession();

    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Create a guest user
    const result = await createGuestFirebaseUser();

    if (!result.success || !result.email || !result.password) {
      return NextResponse.json(
        { error: "Failed to create guest account" },
        { status: 500 }
      );
    }

    // Return guest credentials to the client for authentication
    const guestLoginUrl = new URL("/login", request.url);
    guestLoginUrl.searchParams.set("guestEmail", result.email);
    guestLoginUrl.searchParams.set("guestPassword", result.password);
    guestLoginUrl.searchParams.set("redirectUrl", redirectUrl);
    guestLoginUrl.searchParams.set("isGuest", "true");

    return NextResponse.redirect(guestLoginUrl);
  } catch (error) {
    console.error("Guest authentication error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate as guest" },
      { status: 500 }
    );
  }
}
