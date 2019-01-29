/**
 * Formats a report and returns a string.
 * @param {{ok: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>, warn: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>, error: Array<{url: string, result: "OK"|"WARN"|"ERROR", referrer: string, status: number, next?: Array<string>}>}} report
 */
module.exports = (report) => {
    let ok = `OK (${report.ok.length}):\n`;
    report.ok.forEach(result => {
        ok += `${result.url} from ${result.referrer}\n`
    });
    if (report.ok.length == 0) ok += "-- NONE --\n";

    let warn = `WARN (${report.warn.length}):\n`;
    report.warn.forEach(result => {
        warn += `${result.url} from ${result.referrer}\n`
    });
    if (report.warn.length == 0) warn += "-- NONE --\n";

    let error = `ERROR (${report.error.length}):\n`;
    report.error.forEach(result => {
        error += `${result.url} from ${result.referrer}\n`
    });
    if (report.error.length == 0) error += "-- NONE --\n";

    return `${ok}\n${warn}\n${error}\n\n${report.omit.length} URLs were scanned but ommited.`;
};