import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Providers API has been removed. This app is Foundry-only; configure Azure AI Foundry in Settings.",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Providers API has been removed. This app is Foundry-only; configure Azure AI Foundry in Settings.",
    },
    { status: 410 }
  );
}
