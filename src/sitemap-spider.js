const got = require("got");
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
     * If verbose mode is enabled, logs to console.
     * @param {any} content The content to log.
     */
    log(content) {
        if (!this.verbose) return;

        console.log(content);
    }

    /**
     * Starts the Spider.
     */
    start() {
        this.log("Starting...");

        this.working = true;

        this.log("Retrieving sitemap...");
        let sitemap = new Sitemapper();

        sitemap.fetch(this.sitemapURL).then(sites => {
            this.sitemap = sites.sites;

            this.log("Got sitemap. Starting crawling...");

            this.startCrawling();
        }).catch(err => this.stop());
    }

    /**
     * Stops the spider.
     */
    stop() {
        this.log("Stopped.");
        this.working = false;
    }

    async startCrawling() {
        console.log("\n\n\n\n\nPopulating queue...");

        process.stdout.write("[" + "=".repeat(0) + " ".repeat(100) + `] (0/${this.sitemap.length})`);

        for (let i = 0; i < this.sitemap.length; i++) {
            let urls = await this.getPageURLs(this.sitemap[i]);

            let prog = Math.round((100 * (i + 1)) / this.sitemap.length);

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("[" + "=".repeat(prog) + " ".repeat(100 - prog) + `] (${i + 1}/${this.sitemap.length})`);

            await new Promise(resolve => setTimeout(resolve, this.delay));

            if (urls) this.queue.push(...urls.map(url => {
                return {
                    referrer: this.sitemap[i],
                    url
                };
            }));
        }

        process.stdout.write("\n\n");

        this.log("Queue populated!");
        this.log("\t" + this.queue.map(entry => entry.url).join("\n\t"));

        console.log(`Starting crawl (${this.queue.length} URLs)...`);

        process.stdout.write("[" + "=".repeat(0) + " ".repeat(100) + `] (0/${this.queue.length})`);

        for (let i = 0; i < this.queue.length; i++) {
            this.log(`\n\n[${i + 1}/${this.queue.length}] Crawling ${this.queue[i].url} (from ${this.queue[i].referrer}).`);
            await this.checkStatusCode(this.queue[i].url, this.queue[i].referrer);

            let prog = Math.round((100 * (i + 1)) / this.queue.length);

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("[" + "=".repeat(prog) + " ".repeat(100 - prog) + `] (${i + 1}/${this.queue.length})`);

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        process.stdout.write("\n\n");

        console.log(`Crawl finished with the folowing stats:\n\tPages crawled: ${this.queue.length}\n\tPages with no errors: ${this.report.ok.length}\n\tPages with errors: ${this.report.warn.length + this.report.error.length}\n\tOmitted pages: ${this.report.omit.length}\n\n\n\n\n`);
        this.stop();
    }

    async getPageURLs(url) {
        return new Promise(resolve => {
            got.get(url).then(resp => {
                if (!resp.headers["content-type"].includes("html")) {
                    this.report.ok.push({
                        url,
                        result: "OK",
                        referrer: "SITEMAP",
                        status: resp.statusCode
                    });

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

                    if (!this.urls.includes(elemUrl.replace(/https?:\/\//, ""))) {
                        this.urls.push(elemUrl.replace(/https?:\/\//, ""));
                        urlList.push(elemUrl);
                    }
                });

                resolve(urlList);
            }).catch(err => {
                this.log(`Error when attempting to fetch data from ${url}.`);
                this.log(err);

                this.report.error.push({
                    url,
                    result: "ERROR",
                    referrer: "SITEMAP",
                    status: -1
                });

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
                this.log("\tBlacklisted URL!");

                return resolve({
                    url: url,
                    result: "WARN",
                    referrer,
                    status: -1
                });
            }

            got.get(url, {
                throwHttpErrors: false
            }).then(resp => {
                if (resp.statusCode < 200) {
                    this.log(`\tGot status code ${resp.statusCode}`);

                    this.report.warn.push({
                        url,
                        result: "WARN",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                } else if (resp.statusCode > 399) {
                    this.log(`\tGot status code ${resp.statusCode}`);

                    this.report.error.push({
                        url,
                        result: "ERROR",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                } else {
                    this.log(`\tGot status code ${resp.statusCode}`);

                    this.report.ok.push({
                        url,
                        result: "OK",
                        referrer,
                        status: resp.statusCode
                    });

                    resolve();
                }
            }).catch(err => {
                this.log(`Error when attempting to work on ${url} (from ${referrer}).`);
                this.log(err);

                if (url.toLowerCase().startsWith("mailto:") || url.toLowerCase().endsWith(".css") || url.toLowerCase().endsWith(".pdf")) {
                    this.report.omit.push({
                        url: url,
                        result: "OMIT",
                        referrer,
                        status: 0
                    });

                    resolve();
                } else {
                    this.report.error.push({
                        url: url,
                        result: "ERROR",
                        referrer,
                        status: err.code
                    });

                    resolve();
                }
            });
        });
    }
}

module.exports = Spider;