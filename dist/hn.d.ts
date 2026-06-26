import { HttpClient } from "./http.js";
import type { HnItem, HnUser, NormalizedItem, NormalizedUser, SearchResponse } from "./types.js";
export type LiveListName = "top" | "new" | "best" | "ask" | "show" | "jobs";
export type ScrapedListName = "frontpage" | "active" | "classic" | "launches" | "invited" | "pool" | "bestcomments";
export type SortMode = "date" | "points";
export interface SearchOptions {
    query?: string;
    type?: "story" | "comment" | "poll" | "job" | "all";
    author?: string;
    points?: number;
    comments?: number;
    since?: string;
    until?: string;
    searchAttributes?: string;
    tags?: string;
    filters?: string;
    limit?: number;
    page?: number;
    sort?: SortMode;
}
export interface ItemOptions {
    comments?: boolean;
    depth?: number;
    commentsLimit?: number;
}
export interface UserOptions {
    includeSubmitted?: boolean;
    submittedLimit?: number;
}
export declare class HackerNewsClient {
    readonly http: HttpClient;
    constructor(http?: HttpClient);
    search(options?: SearchOptions): Promise<SearchResponse>;
    liveList(name: LiveListName, limit?: number): Promise<NormalizedItem[]>;
    scrapedList(name: ScrapedListName, limit?: number): Promise<NormalizedItem[]>;
    favorites(username: string, limit?: number): Promise<NormalizedItem[]>;
    item(id: number, options?: ItemOptions): Promise<NormalizedItem>;
    user(username: string, options?: UserOptions): Promise<NormalizedUser>;
    submitted(username: string, options?: {
        limit?: number;
        type?: "story" | "comment" | "all";
    }): Promise<SearchResponse>;
    threads(username: string, limit?: number): Promise<SearchResponse>;
    itemComments(id: number, options?: {
        query?: string;
        author?: string;
        limit?: number;
    }): Promise<SearchResponse>;
    replies(idOrUsername: string, limit?: number): Promise<SearchResponse>;
    whoIsHiring(kind?: "jobs" | "hired" | "freelance" | "all", limit?: number): Promise<SearchResponse>;
    itemsByIds(ids: readonly number[]): Promise<NormalizedItem[]>;
    private getItem;
    private commentTree;
    private loadComments;
}
export declare function buildSearchParams(options: SearchOptions & {
    limit: number;
    page: number;
}): URLSearchParams;
export declare function extractAthingIds(html: string): number[];
export declare function normalizeHnItem(item: HnItem): NormalizedItem;
export declare function normalizeHnUser(user: HnUser, options?: UserOptions): NormalizedUser;
