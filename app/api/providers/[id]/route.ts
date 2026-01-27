import { NextResponse } from "next/server";

const message =
  "Providers API has been removed. This app is Foundry-only; configure Azure AI Foundry in Settings.";

export async function GET() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: message }, { status: 410 });
}
