const Spider = require("./src/spider");
const SitemapSpider = require("./src/sitemap-spider");
const fs = require("fs");

const formatReport = require("./src/format-report");

let startURL = "";
let blacklist = [];
let linkChecker;

if (process.argv.length > 2) startURL = process.argv[2];
if (process.argv.length > 3) blacklist = process.argv.slice(3);

if (startURL.match(/[^\/]\/[^\/]/)) linkChecker = new SitemapSpider(startURL, blacklist, false);
else linkChecker = new Spider(startURL, blacklist);

linkChecker.start();

process.on("exit", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/report_${startURL.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report, startURL));
});


process.on("SIGINT", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/report_${startURL.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report, startURL));
});