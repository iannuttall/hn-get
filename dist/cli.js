#!/usr/bin/env node
import { Command, Option } from "commander";
import { createRequire } from "node:module";
import { HackerNewsClient } from "./hn.js";
import { printOutput } from "./output.js";
import { parseItemId, parseNonNegativeInt, parsePositiveInt } from "./utils.js";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");
const client = new HackerNewsClient();
const program = new Command();
program
    .name("hncli")
    .description("Agent-friendly Hacker News CLI")
    .version(version)
    .showHelpAfterError()
    .addHelpCommand("help [command]", "display help for command");
program
    .command("search [query]")
    .description("Search Hacker News with Algolia")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .option("-p, --page <page>", "zero-based result page", "0")
    .addOption(new Option("--sort <sort>", "sort mode").choices(["date", "points"]).default("date"))
    .addOption(new Option("--type <type>", "item type").choices(["story", "comment", "poll", "job", "all"]).default("all"))
    .option("--author <username>", "filter by author")
    .option("--points <min>", "minimum story points")
    .option("--comments <min>", "minimum comment count")
    .option("--since <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
    .option("--until <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
    .option("--search-attrs <attrs>", "raw Algolia restrictSearchableAttributes value")
    .option("--tags <tags>", "raw Algolia tags expression")
    .option("--filters <filters>", "raw Algolia filters expression")
    .action(withErrorHandling(async (query, options) => {
    const response = await client.search({
        query,
        type: options.type,
        author: options.author,
        points: options.points === undefined ? undefined : parseNonNegativeInt(options.points, "--points"),
        comments: options.comments === undefined ? undefined : parseNonNegativeInt(options.comments, "--comments"),
        since: options.since,
        until: options.until,
        searchAttributes: options.searchAttrs,
        tags: options.tags,
        filters: options.filters,
        limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
        page: parseNonNegativeInt(options.page, "--page", { max: 10_000 }),
        sort: options.sort,
    });
    await printOutput(response, options.format);
}));
addLiveListCommand("top", "Official HN top stories", "top");
addSearchFeedCommand("newest", "Newest stories", {
    tags: "(story,poll)",
    aliases: ["new"],
});
addSearchFeedCommand("frontpage", "Current front page", {
    tags: "front_page",
});
addSearchFeedCommand("newcomments", "Newest comments", {
    tags: "comment",
    defaultType: "comment",
    defaultSearchAttributes: "default",
});
addSearchFeedCommand("ask", "Ask HN stories", {
    tags: "ask_hn",
});
addSearchFeedCommand("show", "Show HN stories", {
    tags: "show_hn",
});
addSearchFeedCommand("polls", "Polls", {
    tags: "poll",
});
addSearchFeedCommand("jobs", "Jobs", {
    tags: "job",
    defaultType: "job",
});
addLiveListCommand("best", "Official HN best stories", "best");
addScrapedListCommand("active", "HN active discussions page", "active");
addScrapedListCommand("classic", "HN classic page", "classic");
addScrapedListCommand("launches", "HN launches page", "launches");
addScrapedListCommand("invited", "HN invited page", "invited");
addScrapedListCommand("pool", "HN pool page", "pool");
addScrapedListCommand("bestcomments", "HN best comments page", "bestcomments");
program
    .command("item <id>")
    .description("Fetch one Hacker News item by id")
    .addOption(createOutputOption())
    .option("--feed", "return comment search results for this item instead of the API item")
    .option("--comments", "include comment tree")
    .option("--depth <depth>", "comment depth when --comments is set", "2")
    .option("--comments-limit <count>", "max comments to fetch when --comments is set", "30")
    .option("-l, --limit <count>", "feed results to return when --feed is set, max 100", "20")
    .option("--author <username>", "filter feed comments by author when --feed is set")
    .action(withErrorHandling(async (id, options) => {
    if (options.feed) {
        await printOutput(await client.itemComments(parseItemId(id), {
            author: options.author,
            limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
        }), options.format);
        return;
    }
    const item = await client.item(parseItemId(id), {
        comments: Boolean(options.comments),
        depth: parseNonNegativeInt(options.depth, "--depth", { max: 10 }),
        commentsLimit: parsePositiveInt(options.commentsLimit, "--comments-limit", { max: 200 }),
    });
    await printOutput(item, options.format);
}));
program
    .command("item-comments <id> [query]")
    .description("Search comments for one story/item")
    .alias("itemfeed")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .option("--author <username>", "filter comments by author")
    .action(withErrorHandling(async (id, query, options) => {
    await printOutput(await client.itemComments(parseItemId(id), {
        query,
        author: options.author,
        limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
    }), options.format);
}));
program
    .command("user <username>")
    .description("Fetch a Hacker News user profile")
    .addOption(createOutputOption())
    .option("--feed", "return user activity feed instead of the profile")
    .option("-l, --limit <count>", "feed results to return when --feed is set, max 100", "20")
    .action(withErrorHandling(async (username, options) => {
    if (options.feed) {
        await printOutput(await client.submitted(username, {
            limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
            type: "all",
        }), options.format);
        return;
    }
    await printOutput(await client.user(username), options.format);
}));
program
    .command("user-feed <username>")
    .description("User activity feed")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .action(withErrorHandling(async (username, options) => {
    await printOutput(await client.submitted(username, {
        limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
        type: "all",
    }), options.format);
}));
program
    .command("profile <username>")
    .description("Alias for user profile")
    .addOption(createOutputOption())
    .action(withErrorHandling(async (username, options) => {
    await printOutput(await client.user(username), options.format);
}));
program
    .command("submitted <username>")
    .description("Find recent submissions/comments by a user")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .addOption(new Option("--type <type>", "submitted item type").choices(["story", "comment", "all"]).default("all"))
    .action(withErrorHandling(async (username, options) => {
    await printOutput(await client.submitted(username, {
        limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
        type: options.type,
    }), options.format);
}));
program
    .command("threads <username>")
    .description("Find recent comment threads by a user")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .action(withErrorHandling(async (username, options) => {
    await printOutput(await client.threads(username, parsePositiveInt(options.limit, "--limit", { max: 100 })), options.format);
}));
program
    .command("replies <id-or-username>")
    .description("Find replies to an item id or to a user's recent comments")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .action(withErrorHandling(async (idOrUsername, options) => {
    await printOutput(await client.replies(idOrUsername, parsePositiveInt(options.limit, "--limit", { max: 100 })), options.format);
}));
program
    .command("comments [query]")
    .description("Search comments")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .option("--author <username>", "filter by author")
    .option("--since <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
    .option("--until <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
    .addOption(new Option("--sort <sort>", "sort mode").choices(["date", "points"]).default("date"))
    .action(withErrorHandling(async (query, options) => {
    await printOutput(await client.search({
        query,
        type: "comment",
        author: options.author,
        since: options.since,
        until: options.until,
        searchAttributes: "default",
        limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
        sort: options.sort,
    }), options.format);
}));
program
    .command("favorites <username>")
    .description("Favorite stories for a user")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "items to return, max 500", "30")
    .action(withErrorHandling(async (username, options) => {
    await printOutput(await client.favorites(username, parsePositiveInt(options.limit, "--limit", { max: 500 })), options.format);
}));
program
    .command("whoishiring [kind]")
    .description("Find comments in the latest Who is hiring threads")
    .addOption(createOutputOption())
    .option("-l, --limit <count>", "results to return, max 100", "20")
    .action(withErrorHandling(async (kind, options) => {
    const normalizedKind = normalizeWhoIsHiringKind(kind);
    await printOutput(await client.whoIsHiring(normalizedKind, parsePositiveInt(options.limit, "--limit", { max: 100 })), options.format);
}));
program.parseAsync();
function createOutputOption() {
    return new Option("-f, --format <format>", "output format")
        .choices(["json", "compact", "ndjson", "markdown", "text"])
        .default("json");
}
function addSearchFeedCommand(command, description, config) {
    const subcommand = program
        .command(`${command} [query]`)
        .description(description)
        .addOption(createOutputOption())
        .option("-l, --limit <count>", "results to return, max 100", "20")
        .option("--points <min>", "minimum story points")
        .option("--comments <min>", "minimum comment count")
        .option("--author <username>", "filter by author")
        .option("--since <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
        .option("--until <date>", "ISO date or relative value like 24h, 7d, 2w, 6mo, 1y")
        .addOption(new Option("--sort <sort>", "sort mode").choices(["date", "points"]).default("date"))
        .option("--search-attrs <attrs>", "raw Algolia restrictSearchableAttributes value")
        .action(withErrorHandling(async (query, options) => {
        await printOutput(await client.search({
            query,
            tags: config.tags,
            type: config.defaultType,
            author: options.author,
            points: options.points === undefined ? undefined : parseNonNegativeInt(options.points, "--points"),
            comments: options.comments === undefined ? undefined : parseNonNegativeInt(options.comments, "--comments"),
            since: options.since,
            until: options.until,
            searchAttributes: options.searchAttrs ?? (query ? config.defaultSearchAttributes : undefined),
            limit: parsePositiveInt(options.limit, "--limit", { max: 100 }),
            sort: options.sort,
        }), options.format);
    }));
    for (const alias of config.aliases ?? []) {
        subcommand.alias(alias);
    }
}
function addLiveListCommand(command, description, list) {
    program
        .command(command)
        .description(description)
        .addOption(createOutputOption())
        .option("-l, --limit <count>", "items to return, max 500", "30")
        .action(withErrorHandling(async (options) => {
        await printOutput(await client.liveList(list, parsePositiveInt(options.limit, "--limit", { max: 500 })), options.format);
    }));
}
function addScrapedListCommand(command, description, list) {
    program
        .command(command)
        .description(description)
        .addOption(createOutputOption())
        .option("-l, --limit <count>", "items to return, max 500", "30")
        .action(withErrorHandling(async (options) => {
        await printOutput(await client.scrapedList(list, parsePositiveInt(options.limit, "--limit", { max: 500 })), options.format);
    }));
}
function withErrorHandling(handler) {
    return async (...args) => {
        try {
            await handler(...args);
        }
        catch (error) {
            console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
            process.exitCode = 1;
        }
    };
}
function normalizeWhoIsHiringKind(kind) {
    const normalized = (kind ?? "all").trim().toLowerCase();
    if (normalized === "jobs" || normalized === "hired" || normalized === "freelance" || normalized === "all") {
        return normalized;
    }
    throw new Error("whoishiring kind must be one of: jobs, hired, freelance, all.");
}
//# sourceMappingURL=cli.js.map