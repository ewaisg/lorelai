import { NextResponse } from "next/server";

const message =
  "Models API has been removed. This app is Foundry-only; configure Azure AI Foundry deployments/models in Settings.";

export async function GET() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: message }, { status: 410 });
}
