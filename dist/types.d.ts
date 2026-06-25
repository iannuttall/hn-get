export type OutputFormat = "json" | "compact" | "ndjson" | "markdown" | "text";
export type HnItemType = "job" | "story" | "comment" | "poll" | "pollopt";
export interface HnItem {
    id: number;
    deleted?: boolean;
    type?: HnItemType;
    by?: string;
    time?: number;
    text?: string;
    dead?: boolean;
    parent?: number;
    poll?: number;
    kids?: number[];
    url?: string;
    score?: number;
    title?: string;
    parts?: number[];
    descendants?: number;
}
export interface HnUser {
    id: string;
    created?: number;
    karma?: number;
    about?: string;
    submitted?: number[];
}
export interface CommentNode {
    id: number;
    by?: string;
    time?: string;
    timeUnix?: number;
    text?: string;
    textPlain?: string;
    parent?: number;
    dead?: boolean;
    deleted?: boolean;
    url: string;
    children: CommentNode[];
}
export interface NormalizedItem {
    id: number;
    type?: HnItemType;
    title?: string;
    url?: string;
    hnUrl: string;
    by?: string;
    score?: number;
    descendants?: number;
    time?: string;
    timeUnix?: number;
    text?: string;
    textPlain?: string;
    parent?: number;
    dead?: boolean;
    deleted?: boolean;
    comments?: CommentNode[];
}
export interface AlgoliaHit {
    objectID?: string;
    title?: string;
    url?: string;
    author?: string;
    points?: number;
    story_text?: string;
    comment_text?: string;
    story_title?: string;
    story_id?: number;
    parent_id?: number;
    created_at?: string;
    created_at_i?: number;
    num_comments?: number;
    _tags?: string[];
}
export interface AlgoliaResponse {
    hits?: AlgoliaHit[];
    nbHits?: number;
    page?: number;
    nbPages?: number;
    hitsPerPage?: number;
    processingTimeMS?: number;
    query?: string;
    params?: string;
}
export interface SearchResult {
    id: number;
    objectID: string;
    type?: string;
    title?: string;
    storyTitle?: string;
    url?: string;
    hnUrl: string;
    author?: string;
    points?: number;
    comments?: number;
    createdAt?: string;
    createdAtUnix?: number;
    text?: string;
    textPlain?: string;
    storyId?: number;
    parentId?: number;
    tags: string[];
}
export interface SearchResponse {
    query: string;
    count: number;
    total: number;
    page: number;
    pages: number;
    hitsPerPage: number;
    processingTimeMs?: number;
    url: string;
    results: SearchResult[];
}
export interface HttpClientOptions {
    timeoutMs?: number;
    retries?: number;
    userAgent?: string;
}
