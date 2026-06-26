import he from "he";
import { HttpClient } from "./http.js";
import { compactObject, hnItemUrl, htmlToPlainText, mapLimit, parseDateishToUnix, toIsoFromUnix } from "./utils.js";
const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const HN_BASE = "https://news.ycombinator.com";
const ALGOLIA_SEARCH = "https://hn.algolia.com/api/v1/search";
const ALGOLIA_SEARCH_BY_DATE = "https://hn.algolia.com/api/v1/search_by_date";
const MAX_LIST_LIMIT = 500;
const MAX_SEARCH_LIMIT = 100;
const MAX_COMMENT_LIMIT = 200;
const DEFAULT_CONCURRENCY = 8;
const { decode } = he;
export class HackerNewsClient {
    http;
    constructor(http = new HttpClient()) {
        this.http = http;
    }
    async search(options = {}) {
        const limit = clampInt(options.limit ?? 20, 1, MAX_SEARCH_LIMIT);
        const page = Math.max(0, Math.floor(options.page ?? 0));
        const endpoint = options.sort === "points" ? ALGOLIA_SEARCH : ALGOLIA_SEARCH_BY_DATE;
        const params = buildSearchParams({ ...options, limit, page });
        const url = `${endpoint}?${params.toString()}`;
        const response = await this.http.getJson(url);
        const hits = Array.isArray(response.hits) ? response.hits : [];
        const results = hits.map(normalizeAlgoliaHit).filter((hit) => Boolean(hit));
        return {
            query: options.query ?? "",
            count: results.length,
            total: response.nbHits ?? results.length,
            page: response.page ?? page,
            pages: response.nbPages ?? 1,
            hitsPerPage: response.hitsPerPage ?? limit,
            processingTimeMs: response.processingTimeMS,
            url,
            results,
        };
    }
    async liveList(name, limit = 30) {
        const listLimit = clampInt(limit, 1, MAX_LIST_LIMIT);
        const ids = await this.http.getJson(`${HN_API_BASE}/${liveListPath(name)}.json`);
        return this.itemsByIds(ids.slice(0, listLimit));
    }
    async scrapedList(name, limit = 30) {
        const listLimit = clampInt(limit, 1, MAX_LIST_LIMIT);
        const html = await this.http.getText(scrapedListUrl(name));
        const ids = extractAthingIds(html).slice(0, listLimit);
        return this.itemsByIds(ids);
    }
    async favorites(username, limit = 30) {
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            throw new Error("Username is required.");
        }
        const listLimit = clampInt(limit, 1, MAX_LIST_LIMIT);
        const html = await this.http.getText(`${HN_BASE}/favorites?id=${encodeURIComponent(cleanUsername)}`);
        const ids = extractAthingIds(html).slice(0, listLimit);
        return this.itemsByIds(ids);
    }
    async item(id, options = {}) {
        const item = await this.getItem(id);
        if (!item) {
            throw new Error(`Hacker News item ${id} was not found.`);
        }
        const normalized = normalizeHnItem(item);
        if (options.comments && Array.isArray(item.kids) && item.kids.length > 0) {
            const limit = clampInt(options.commentsLimit ?? 30, 1, MAX_COMMENT_LIMIT);
            const depth = clampInt(options.depth ?? 2, 0, 10);
            normalized.comments = await this.commentTree(item.kids, { depth, limit });
        }
        return normalized;
    }
    async user(username, options = {}) {
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            throw new Error("Username is required.");
        }
        const user = await this.http.getJson(`${HN_API_BASE}/user/${encodeURIComponent(cleanUsername)}.json`);
        if (!user) {
            throw new Error(`Hacker News user ${cleanUsername} was not found.`);
        }
        return normalizeHnUser(user, options);
    }
    async submitted(username, options = {}) {
        const type = options.type === "all" || !options.type ? "all" : options.type;
        const tags = type === "all" ? `(story,comment,poll),author_${username}` : `${type},author_${username}`;
        return this.search({ tags, limit: options.limit ?? 20, sort: "date" });
    }
    async threads(username, limit = 20) {
        return this.search({
            tags: `comment,author_${username}`,
            limit,
            sort: "date",
            type: "comment",
        });
    }
    async itemComments(id, options = {}) {
        const tags = [`comment`, `story_${id}`];
        if (options.author?.trim()) {
            tags.push(`author_${options.author.trim()}`);
        }
        return this.search({
            query: options.query,
            tags: tags.join(","),
            type: "comment",
            searchAttributes: "default",
            limit: options.limit ?? 20,
            sort: "date",
        });
    }
    async replies(idOrUsername, limit = 20) {
        if (/^\d+$/.test(idOrUsername.trim())) {
            return this.search({
                type: "comment",
                filters: `parent_id=${idOrUsername.trim()}`,
                limit,
                sort: "date",
            });
        }
        const prefetch = await this.search({
            tags: `comment,author_${idOrUsername.trim()}`,
            limit: 100,
            sort: "date",
            type: "comment",
        });
        const parentFilters = prefetch.results.map((result) => `parent_id=${result.id}`).join(" OR ");
        if (!parentFilters) {
            return {
                query: "",
                count: 0,
                total: 0,
                page: 0,
                pages: 0,
                hitsPerPage: limit,
                url: "",
                results: [],
            };
        }
        return this.search({
            type: "comment",
            filters: parentFilters,
            limit,
            sort: "date",
        });
    }
    async whoIsHiring(kind = "all", limit = 20) {
        const queryByKind = {
            jobs: "Ask HN: Who is hiring?",
            hired: "Ask HN: Who wants to be hired?",
            freelance: "Ask HN: Freelancer? Seeking freelancer?",
            all: "",
        };
        const storySearch = await this.search({
            query: queryByKind[kind],
            tags: "story,author_whoishiring",
            limit: kind === "all" ? 10 : 1,
            sort: "date",
        });
        const storyIds = storySearch.results.map((result) => result.id);
        if (storyIds.length === 0) {
            throw new Error("No current whoishiring stories found.");
        }
        return this.search({
            type: "comment",
            filters: storyIds.map((id) => `parent_id=${id}`).join(" OR "),
            limit,
            sort: "date",
        });
    }
    async itemsByIds(ids) {
        const items = await mapLimit(ids, DEFAULT_CONCURRENCY, async (id) => this.getItem(id));
        return items.filter((item) => Boolean(item)).map(normalizeHnItem);
    }
    async getItem(id) {
        return this.http.getJson(`${HN_API_BASE}/item/${id}.json`);
    }
    async commentTree(ids, options) {
        const budget = { remaining: options.limit };
        return this.loadComments(ids, 0, options.depth, budget);
    }
    async loadComments(ids, depth, maxDepth, budget) {
        if (depth > maxDepth || budget.remaining <= 0 || ids.length === 0) {
            return [];
        }
        const slice = ids.slice(0, budget.remaining);
        budget.remaining -= slice.length;
        const items = await mapLimit(slice, DEFAULT_CONCURRENCY, async (id) => this.getItem(id));
        const nodes = [];
        for (const item of items) {
            if (!item || item.type !== "comment") {
                continue;
            }
            const node = normalizeComment(item);
            if (Array.isArray(item.kids) && item.kids.length > 0 && depth < maxDepth && budget.remaining > 0) {
                node.children = await this.loadComments(item.kids, depth + 1, maxDepth, budget);
            }
            nodes.push(node);
        }
        return nodes;
    }
}
export function buildSearchParams(options) {
    const params = new URLSearchParams();
    const query = options.query?.trim() ?? "";
    if (query) {
        params.set("query", query);
    }
    const tags = buildTags(options);
    if (tags) {
        params.set("tags", tags);
    }
    const numericFilters = buildNumericFilters(options);
    if (numericFilters.length > 0) {
        params.set("numericFilters", numericFilters.join(","));
    }
    if (options.filters?.trim()) {
        params.set("filters", options.filters.trim());
    }
    if (options.searchAttributes?.trim() && options.searchAttributes.trim() !== "default") {
        params.set("restrictSearchableAttributes", options.searchAttributes.trim());
    }
    params.set("hitsPerPage", String(options.limit));
    params.set("page", String(options.page));
    return params;
}
export function extractAthingIds(html) {
    const patterns = [
        /<tr\b[^>]*\bclass=["'][^"']*\bathing\b[^"']*["'][^>]*\bid=["'](\d+)["'][^>]*>/g,
        /<tr\b[^>]*\bid=["'](\d+)["'][^>]*\bclass=["'][^"']*\bathing\b[^"']*["'][^>]*>/g,
    ];
    const ids = [];
    const seen = new Set();
    for (const pattern of patterns) {
        for (const match of html.matchAll(pattern)) {
            const id = Number.parseInt(match[1], 10);
            if (Number.isFinite(id) && !seen.has(id)) {
                seen.add(id);
                ids.push(id);
            }
        }
    }
    return ids;
}
export function normalizeHnItem(item) {
    return compactObject({
        id: item.id,
        type: item.type,
        title: item.title ? decode(item.title) : undefined,
        url: item.url,
        hnUrl: hnItemUrl(item.id),
        by: item.by,
        score: item.score,
        descendants: item.descendants,
        time: toIsoFromUnix(item.time),
        timeUnix: item.time,
        text: item.text,
        textPlain: htmlToPlainText(item.text),
        parent: item.parent,
        dead: item.dead,
        deleted: item.deleted,
    });
}
export function normalizeHnUser(user, options = {}) {
    const submitted = Array.isArray(user.submitted) ? user.submitted : [];
    const profile = compactObject({
        id: user.id,
        created: user.created,
        createdAt: toIsoFromUnix(user.created),
        karma: user.karma,
        about: user.about,
        aboutPlain: htmlToPlainText(user.about),
        hnUrl: `${HN_BASE}/user?id=${encodeURIComponent(user.id)}`,
        submittedCount: submitted.length,
    });
    if (options.includeSubmitted) {
        const limit = options.submittedLimit === undefined ? submitted.length : clampInt(options.submittedLimit, 0, submitted.length);
        profile.submitted = submitted.slice(0, limit);
        profile.submittedReturned = profile.submitted.length;
    }
    return profile;
}
function normalizeComment(item) {
    return compactObject({
        id: item.id,
        by: item.by,
        time: toIsoFromUnix(item.time),
        timeUnix: item.time,
        text: item.text,
        textPlain: htmlToPlainText(item.text),
        parent: item.parent,
        dead: item.dead,
        deleted: item.deleted,
        url: hnItemUrl(item.id),
        children: [],
    });
}
function normalizeAlgoliaHit(hit) {
    const id = Number.parseInt(String(hit.objectID ?? ""), 10);
    if (!Number.isFinite(id)) {
        return null;
    }
    const tags = Array.isArray(hit._tags) ? hit._tags : [];
    const type = tags.find((tag) => ["story", "comment", "poll", "job"].includes(tag));
    const text = hit.comment_text ?? hit.story_text;
    return compactObject({
        id,
        objectID: String(hit.objectID),
        type,
        title: hit.title ? decode(hit.title) : undefined,
        storyTitle: hit.story_title ? decode(hit.story_title) : undefined,
        url: hit.url,
        hnUrl: hnItemUrl(hit.objectID ?? id),
        author: hit.author,
        points: hit.points,
        comments: hit.num_comments,
        createdAt: hit.created_at,
        createdAtUnix: hit.created_at_i,
        text,
        textPlain: htmlToPlainText(text),
        storyId: hit.story_id,
        parentId: hit.parent_id,
        tags,
    });
}
function buildTags(options) {
    const parts = [];
    if (options.tags?.trim()) {
        parts.push(options.tags.trim());
    }
    else if (options.type && options.type !== "all") {
        parts.push(options.type);
    }
    if (options.author?.trim()) {
        parts.push(`author_${options.author.trim()}`);
    }
    return parts.join(",");
}
function buildNumericFilters(options) {
    const filters = [];
    if (typeof options.points === "number") {
        filters.push(`points>=${options.points}`);
    }
    if (typeof options.comments === "number") {
        filters.push(`num_comments>=${options.comments}`);
    }
    if (options.since) {
        filters.push(`created_at_i>=${parseDateishToUnix(options.since)}`);
    }
    else if (options.tags === "front_page") {
        filters.push(`created_at_i>=${Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60}`);
    }
    if (options.until) {
        filters.push(`created_at_i<=${parseDateishToUnix(options.until)}`);
    }
    return filters;
}
function liveListPath(name) {
    const paths = {
        top: "topstories",
        new: "newstories",
        best: "beststories",
        ask: "askstories",
        show: "showstories",
        jobs: "jobstories",
    };
    return paths[name];
}
function scrapedListUrl(name) {
    const paths = {
        frontpage: "news",
        active: "active",
        classic: "classic",
        launches: "launches",
        invited: "invited",
        pool: "pool",
        bestcomments: "bestcomments",
    };
    return `${HN_BASE}/${paths[name]}`;
}
function clampInt(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.max(min, Math.min(max, Math.floor(value)));
}
//# sourceMappingURL=hn.js.map