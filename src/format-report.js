/**
 * Formats a report and returns a string.
 * @param {{ok: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>, warn: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>, error: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>}} report
 * @param {string} host
 */
module.exports = (report, host) => {
    let okCodes = {};
    let warnCodes = {};
    let errorCodes = {};

    report.ok.forEach(result => {
        if (!okCodes[result.status]) okCodes[result.status] = [];
        okCodes[result.status].push(`${result.url} from ${result.referrer}`);
    });

    report.warn.forEach(result => {
        if (!warnCodes[result.status]) warnCodes[result.status] = [];
        warnCodes[result.status].push(`${result.url} from ${result.referrer}`);
    });

    report.error.forEach(result => {
        if (!errorCodes[result.status]) errorCodes[result.status] = [];
        errorCodes[result.status].push(`${result.url} from ${result.referrer}`);
    });

    let content = `CRAWL REPORT FOR ${host}\n${(new Date()).toLocaleString("en-US")}\n\n------\n| OK |\n------`;

    for (let code in okCodes) {
        content += `\n${code}:\n\t`;

        content += okCodes[code].join("\n\t");
    }

    content += "\n\n--------\n| WARN |\n--------";

    for (let code in warnCodes) {
        content += `\n${code}:\n\t`;

        content += warnCodes[code].join("\n\t");
    }

    content += "\n\n---------\n| ERROR |\n---------";

    for (let code in errorCodes) {
        content += `\n${code}:\n\t`;

        content += errorCodes[code].join("\n\t");
    }

    content += `\n\n${report.omit.length} URLs were scanned but ommited.`;

    return content;
};