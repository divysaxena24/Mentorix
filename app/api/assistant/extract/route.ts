import { NextResponse } from "next/server";
import { extractJobData } from "@/lib/ai/assistant-utils";

export async function POST(req: Request) {
    try {
        const { url, rawContent } = await req.json();
        const data = await extractJobData(url, rawContent);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
