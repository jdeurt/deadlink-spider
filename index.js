const Spider = require("./src/spider");
const fs = require("fs");

const formatReport = require("./src/format-report");

let startURL = "";
let blacklist = [];

if (process.argv.length > 2) startURL = process.argv[2];
if (process.argv.length > 3) blacklist = process.argv.slice(3);

const linkChecker = new Spider(startURL, blacklist, true);

linkChecker.start();

/*
process.on("exit", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/crawl-path_${startURL.replace(/\//g, "")}_${Date.now()}.json`, JSON.stringify(linkChecker.crawlPath));
    fs.writeFileSync(`./output/report_${startURL.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report, startURL));
    process.exit();
});*/

process.on("SIGINT", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/crawl-path_${startURL.replace(/\//g, "")}_${Date.now()}.json`, JSON.stringify(linkChecker.crawlPath));
    fs.writeFileSync(`./output/report_${startURL.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report, startURL));
    process.exit();
});