import { google } from 'googleapis';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

export async function searchYoutubeVideos(lessonTitle: string, topic: string, level: string) {
    if (!process.env.YOUTUBE_API_KEY) {
        console.warn("YOUTUBE_API_KEY is missing. Skipping video search.");
        return [];
    }

    // Build smart query for high-quality educational content
    const query = `${lessonTitle} ${topic} ${level} masterclass university lecture documentation`;

    try {
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 5,
            type: ['video'],
            relevanceLanguage: 'en',
            videoDuration: 'medium', // > 4 mins (closest to 10m available in basic filters, viewCount filter handled in post-processing if needed)
            safeSearch: 'moderate',
            order: 'relevance'
        });

        // The YouTube Search API doesn't allow a direct "viewCount > 10000" filter in the search.list call.
        // We fetch candidates and return their metadata for the AI to rank.
        return response.data.items?.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url
        })) || [];
    } catch (error) {
        console.error("YouTube Search Error:", error);
        return [];
    }
}
