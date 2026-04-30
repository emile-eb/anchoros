import { NextResponse } from "next/server";
import { getDiscoveryJobForWorkspace } from "@/lib/data/discovery-jobs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getDiscoveryJobForWorkspace(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Discovery job not found.",
      },
      { status: 404 },
    );
  }
}
