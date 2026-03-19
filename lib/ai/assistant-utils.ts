import axios from "axios";
import { chatWithGroq } from "./groq";

export async function extractJobData(url: string, rawContent?: string) {
    let html = rawContent;

    if (url && !html) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            html = response.data;
        } catch (error) {
            console.error("Failed to fetch URL:", error);
            throw new Error("Could not access the job URL. Please paste the content manually.");
        }
    }

    if (!html) throw new Error("No job content provided");

    const prompt = `
    Extract job details from the following content. Provide a JSON object with:
    - jobTitle (string)
    - companyName (string)
    - requirements (array of strings)
    - applicationQuestions (array of questions/fields found in the form, if any)
    - documentsRequired (array of strings like "Resume", "Cover Letter", "SOP")
    - platform (the name of the site, e.g., Unstop, LinkedIn, Internshala)
    - applyUrl (the direct link to the application/form if found)

    Content:
    ${html.substring(0, 15000)}
    `;

    const data = await chatWithGroq(
        [{ role: "user", content: prompt }],
        { response_format: { type: "json_object" } }
    );

    return data.choices[0].message.content ? JSON.parse(data.choices[0].message.content) : {};
}
