# Deadlink Spider
A simple NodeJS spider that crawls a website in search of bad links.

## Setup
1) Install NodeJS if you haven't already.
2) Clone this repository into whatever folder name you like.
3) `cd` into the folder.
4) Run `npm i`.
5) Create your own .env file following the format of .env.example.

## Run
```bash
node . {URL} {BLACKLIST}
```
where {BLACKLIST} is a list of words that should never appear in scanned URLs separated by spaces.

## Output
The output of each test will be saved to a crawl-path_{DOMAIN}_{DATE}.json file and a report_{DOMAIN}_{DATE}.txt file.

The report file will follow the following format:
```
OK {number}:
{URLs}

WARN {number}:
{URLs}

ERROR {number}:
{URLs}
```
URLs under the OK section are all good. Ones under the WARN section have minor problems but aren't necessarily broken. URLs under the ERROR section are either non-responsive to a GET request or return an error.

The JSON file is simple a file containing the data for all URLs crawled.