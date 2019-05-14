const got = require("got");
const readline = require("readline");
const table = require("text-table");
const cheerio = require("cheerio");
const urlLib = require("url");

class Spider {
    /**
     * Creates a Sitemap Spider.
     * @param {string} root The root of the website.
     * @param {string[]} blacklist An array of URLs that should NEVER appear in the scan.
     * @param {number} delay The delay between requests.
     */
    constructor(root, blacklist = [], delay = 100) {
        if (!root.startsWith("http")) root = "http://" + root;

        this.root = root.replace(/https?:\/\//, "").replace(/\/$/, "");
        this.blacklist = blacklist;
        this.delay = delay;
        this.sitemap = [];
        this.queue = [{
            url: root,
            referrer: root
        }];
        this.urls = [root.replace(/https?:\/\//, "").replace(/\/$/, "")];
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
        this.working = true;

        this.startCrawling();
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

        while (this.queue.length > 0) {
            readline.cursorTo(process.stdout, 0, 5);
            readline.clearScreenDown(process.stdout);
            process.stdout.write(`Working on ${this.queue[0].url} (from ${this.queue[0].referrer}).`);

            readline.cursorTo(process.stdout, 0, 10);
            process.stdout.write(table([
                ["Queue Length", ":", this.queue.length],
                ["", "", ""],
                ["OK", ":", this.report.ok.length],
                ["WARN", ":", this.report.warn.length],
                ["ERROR", ":", this.report.error.length],
                ["OMIT", ":", this.report.omit.length]
            ], {
                align: ["r", "c", "l"]
            }));

            readline.cursorTo(process.stdout, 0, 20);

            await this.crawlURL(this.queue[0].url, this.queue[0].referrer);

            this.queue.shift();

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        readline.cursorTo(process.stdout, 0, 20);
        console.log("Done!");
    }

    /**
     * Crawl a URL in search of links.
     * @param {string} url 
     * @param {string} referrer 
     */
    async crawlURL(url, referrer) {
        return new Promise(resolve => {
            try {
                if (!(new URL(url).host).includes(this.root)) {
                    this.report.omit.push({
                        url: url,
                        result: "OMIT",
                        referrer,
                        status: 0
                    });
    
                    return resolve();
                }
            } catch (err) {
                this.report.error.push({
                    url: url,
                    result: "ERROR",
                    referrer,
                    status: "ERR_INVALID_URL"
                });

                return resolve();
            }

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

                return resolve();
            }

            got.get(url, {
                timeout: 1000 * 30,
                throwHttpErrors: false
            }).then(resp => {
                if (resp.statusCode < 200) {
                    this.report.warn.push({
                        url,
                        result: "WARN",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                } else if (resp.statusCode > 399) {
                    this.report.error.push({
                        url,
                        result: "ERROR",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                } else {
                    if (!resp.headers["content-type"].includes("html")) {
                        this.report.ok.push({
                            url,
                            result: "OK",
                            referrer,
                            status: resp.statusCode
                        });

                        return resolve();
                    }

                    const $ = cheerio.load(resp.body);

                    $("*[href], *[src]").each((i, elem) => {
                        let elemUrl = $(elem).attr("href") || $(elem).attr("src");

                        elemUrl = urlLib.resolve(url, elemUrl);

                        let strippedElemUrl = elemUrl.replace(/https?:\/\//, "").replace(/\/$/, "");

                        if (!this.urls.includes(strippedElemUrl)) {
                            this.urls.push(strippedElemUrl);

                            this.queue.push({
                                url: elemUrl,
                                referrer: url
                            });
                        }
                    });

                    this.report.ok.push({
                        url,
                        result: "OK",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                }
            }).catch(err => {
                this.report.error.push({
                    url,
                    result: "ERROR",
                    referrer,
                    status: err.code
                });

                resolve();
            });
        });
    }
}

module.exports = Spider;