import { FeedItem } from "@/pages/components/Feed";

export const processFeedItem = async (items: FeedItem[]) => {
    // if feed items' createdAt- today is greater than duration then we should discard those feed  itemes.
    const filteredItems = items?.filter(feedItem => {
        const createdAt = new Date(feedItem.createdAt).getTime();
        const durationInDays = parseInt(feedItem.duration);
        const durationInMs = durationInDays * 24 * 60 * 60 * 1000; 
        const timeDiff = Date.now() - createdAt;
        console.log(timeDiff);

        return timeDiff < durationInMs;
    });
    return filteredItems;
}