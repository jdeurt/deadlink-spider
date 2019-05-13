const got = require("got");
const readline = require("readline");
const table = require("text-table");
const cheerio = require("cheerio");
const Sitemapper = require("sitemapper");

class Spider {
    /**
     * Creates a Sitemap Spider.
     * @param {string} sitemapURL The location of the XML sitemap.
     * @param {string[]} blacklist An array of URLs that should NEVER appear in the scan.
     * @param {boolean} verbose Whether or not to log steps to the console.
     */
    constructor(sitemapURL, blacklist = [], verbose = false, delay = 100) {
        if (!sitemapURL.startsWith("http")) domain = "http://" + domain;

        this.sitemapURL = sitemapURL;
        this.blacklist = blacklist;
        this.verbose = verbose;
        this.delay = delay;
        this.sitemap = [];
        this.queue = [];
        this.urls = [];
        this.working = false;
        this.report = {
            ok: [],
            warn: [],
            error: [],
            omit: []
        }
    }

    /**
     * Starts the Spider.
     */
    start() {
        console.log("Starting...");

        this.working = true;

        console.log("Retrieving sitemap...");
        let sitemap = new Sitemapper();

        sitemap.fetch(this.sitemapURL).then(sites => {
            this.sitemap = sites.sites;

            console.log("Got sitemap!");

            this.startCrawling();
        }).catch(err => this.stop());
    }

    /**
     * Stops the spider.
     */
    stop() {
        this.working = false;
    }

    async startCrawling() {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write("\n\n\nPopulating queue...\n\n[" + " ".repeat(100) + `] (0/${this.sitemap.length})`);
        readline.cursorTo(process.stdout, 0, 10);

        for (let i = 0; i < this.sitemap.length; i++) {
            let prog = Math.round((100 * (i + 1)) / this.sitemap.length);

            readline.cursorTo(process.stdout, 0, 5);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 6);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 7);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 8);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 9);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 5);
            process.stdout.write("[" + "=".repeat(prog) + " ".repeat(100 - prog) + `] (${i + 1}/${this.sitemap.length})\n${this.sitemap[i]}`);
            readline.cursorTo(process.stdout, 0, 0);

            let urls = await this.getPageURLs(this.sitemap[i]);

            await new Promise(resolve => setTimeout(resolve, this.delay));

            if (urls) this.queue.push(...urls.map(url => {
                return {
                    referrer: this.sitemap[i],
                    url
                };
            }));
        }

        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write("\n\n\nCrawling URLs...\n\n[" + " ".repeat(100) + `] (0/${this.queue.length})`);
        readline.cursorTo(process.stdout, 0, 10);

        for (let i = 0; i < this.queue.length; i++) {
            let prog = Math.round((100 * (i + 1)) / this.queue.length);

            readline.cursorTo(process.stdout, 0, 5);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 6);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 7);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 8);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 9);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, 5);
            process.stdout.write("[" + "=".repeat(prog) + " ".repeat(100 - prog) + `] (${i + 1}/${this.queue.length})\n${this.queue[i].url}`);
            readline.cursorTo(process.stdout, 0, 0);

            await this.checkStatusCode(this.queue[i].url, this.queue[i].referrer);

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        process.stdout.write("\n\n");

        console.log(`Crawl finished with the folowing stats:\n\tPages crawled: ${this.queue.length}\n\tPages with no errors: ${this.report.ok.length}\n\tPages with errors: ${this.report.warn.length + this.report.error.length}\n\tOmitted pages: ${this.report.omit.length}\n\n\n\n\n`);
        this.stop();
    }

    async getPageURLs(url) {
        return new Promise(resolve => {
            got.get(url, {
                timeout: 1000 * 30
            }).then(resp => {
                if (!resp.headers["content-type"].includes("html")) {
                    this.report.ok.push({
                        url,
                        result: "OK",
                        referrer: "SITEMAP",
                        status: resp.statusCode
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["Errors", ":", this.report.error.length],
                        ["Queue Size", ":", this.queue.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    return resolve(false);
                }

                const $ = cheerio.load(resp.body);
                let urlList = [];

                $("*[href*='.'], *[src*='.']").each((i, elem) => {
                    let elemUrl = $(elem).attr("href") || $(elem).attr("src");

                    if (elemUrl.startsWith("//")) {
                        elemUrl = "http:" + elemUrl;
                    } else if (elemUrl.startsWith("/")) {
                        elemUrl = url + elemUrl;
                    }

                    elemUrl = elemUrl.replace(/\/$/, "");
                    let strippedElemUrl = elemUrl.replace(/https?:\/\//, "");

                    if (!this.urls.includes(strippedElemUrl)) {
                        this.urls.push(strippedElemUrl);
                        urlList.push(elemUrl);

                        readline.cursorTo(process.stdout, 0, 10);
                        readline.clearScreenDown(process.stdout);
                        process.stdout.write(table([
                            ["Errors", ":", this.report.error.length],
                            ["Queue Size", ":", this.queue.length]
                        ], {
                            align: ["r", "c", "l"]
                        }));
                        readline.cursorTo(process.stdout, 0, 0);
                    }
                });

                resolve(urlList);
            }).catch(err => {
                this.report.error.push({
                    url,
                    result: "ERROR",
                    referrer: "SITEMAP",
                    status: err.code
                });

                readline.cursorTo(process.stdout, 0, 10);
                readline.clearScreenDown(process.stdout);
                process.stdout.write(table([
                    ["Errors", ":", this.report.error.length],
                    ["Queue Size", ":", this.queue.length]
                ], {
                    align: ["r", "c", "l"]
                }));
                readline.cursorTo(process.stdout, 0, 0);

                resolve(false);
            });
        });
    }

    async checkStatusCode(url, referrer) {
        return new Promise(resolve => {
            let isBlacklisted = false;
            this.blacklist.forEach(str => {
                if (url.includes(str)) isBlacklisted = true;
            });
            if (isBlacklisted) {
                this.report.warn.push({
                    url: url,
                    result: "WARN",
                    referrer,
                    status: "BLACKLISTED"
                });

                readline.cursorTo(process.stdout, 0, 10);
                readline.clearScreenDown(process.stdout);
                process.stdout.write(table([
                    ["OK", ":", this.report.ok.length],
                    ["WARN", ":", this.report.warn.length],
                    ["ERROR", ":", this.report.error.length],
                    ["OMIT", ":", this.report.omit.length]
                ], {
                    align: ["r", "c", "l"]
                }));
                readline.cursorTo(process.stdout, 0, 0);

                return resolve();
            }

            got.head(url, {
                throwHttpErrors: false,
                timeout: 1000 * 10
            }).then(resp => {
                if (resp.statusCode < 200) {
                    this.report.warn.push({
                        url,
                        result: "WARN",
                        referrer,
                        status: resp.statusCode
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["OK", ":", this.report.ok.length],
                        ["WARN", ":", this.report.warn.length],
                        ["ERROR", ":", this.report.error.length],
                        ["OMIT", ":", this.report.omit.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    resolve();
                } else if (resp.statusCode > 399) {
                    this.report.error.push({
                        url,
                        result: "ERROR",
                        referrer,
                        status: resp.statusCode
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["OK", ":", this.report.ok.length],
                        ["WARN", ":", this.report.warn.length],
                        ["ERROR", ":", this.report.error.length],
                        ["OMIT", ":", this.report.omit.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    resolve();
                } else {
                    this.report.ok.push({
                        url,
                        result: "OK",
                        referrer,
                        status: resp.statusCode
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["OK", ":", this.report.ok.length],
                        ["WARN", ":", this.report.warn.length],
                        ["ERROR", ":", this.report.error.length],
                        ["OMIT", ":", this.report.omit.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    resolve();
                }
            }).catch(err => {
                if (url.toLowerCase().startsWith("mailto:") || url.toLowerCase().endsWith(".css") || url.toLowerCase().endsWith(".pdf")) {
                    this.report.omit.push({
                        url: url,
                        result: "OMIT",
                        referrer,
                        status: 0
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["OK", ":", this.report.ok.length],
                        ["WARN", ":", this.report.warn.length],
                        ["ERROR", ":", this.report.error.length],
                        ["OMIT", ":", this.report.omit.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    resolve();
                } else {
                    this.report.error.push({
                        url: url,
                        result: "ERROR",
                        referrer,
                        status: err.code
                    });

                    readline.cursorTo(process.stdout, 0, 10);
                    readline.clearScreenDown(process.stdout);
                    process.stdout.write(table([
                        ["OK", ":", this.report.ok.length],
                        ["WARN", ":", this.report.warn.length],
                        ["ERROR", ":", this.report.error.length],
                        ["OMIT", ":", this.report.omit.length]
                    ], {
                        align: ["r", "c", "l"]
                    }));
                    readline.cursorTo(process.stdout, 0, 0);

                    resolve();
                }
            });
        });
    }
}

module.exports = Spider;