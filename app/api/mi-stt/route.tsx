import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { groq } from "@/lib/ai/groq";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!process.env.GROQ_API_KEY) {
            console.error("[STT_ERROR] GROQ_API_KEY is missing");
            return new NextResponse("API Configuration Error", { status: 500 });
        }

        const formData = await req.formData();
        const audioFile = formData.get("file") as File;

        if (!audioFile) {
            return new NextResponse("No audio file provided", { status: 400 });
        }

        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, buffer);

        try {
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-large-v3",
                language: "en",
            });

            return NextResponse.json({
                text: transcription.text,
            });

        } catch (groqError: any) {
            console.error("[STT_GROQ_ERROR]", groqError.message || groqError);
            return new NextResponse(groqError.message || "Groq Transcription Failed", { status: 500 });
        } finally {
            if (fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }

    } catch (error: any) {
        console.error("[STT_INTERNAL_ERROR]", error.message || error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
