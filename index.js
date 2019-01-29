const Spider = require("./src/spider");
const dotenv = require("dotenv");
const fs = require("fs");

const formatReport = require("./src/format-report");

dotenv.load(".env");
let startURL = process.env.DOMAIN;

if (process.argv.length > 2) startURL = process.argv[2];

const linkChecker = new Spider(startURL, true);

linkChecker.start();

process.on("exit", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/crawl-path_${process.env.DOMAIN.replace(/\//g, "")}_${Date.now()}.json`, JSON.stringify(linkChecker.crawlPath));
    fs.writeFileSync(`./output/report_${process.env.DOMAIN.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report));
    process.exit();
});

process.on("SIGINT", () => {
    linkChecker.stop();
    fs.writeFileSync(`./output/crawl-path_${process.env.DOMAIN.replace(/\//g, "")}_${Date.now()}.json`, JSON.stringify(linkChecker.crawlPath));
    fs.writeFileSync(`./output/report_${process.env.DOMAIN.replace(/\//g, "")}_${Date.now()}.txt`, formatReport(linkChecker.report));
    process.exit();
});