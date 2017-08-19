const fs = require('fs');
const walk = require('walk');
const fileExtension = require('file-extension');
const path = require('path');
const fm = require('front-matter');
const cheerio = require('cheerio');
const md = require('markdown-it')();
const trim = require('trim');

const createResultFromMarkdown = function(data) {
    const dataString = data.toString();
    const extraction = fm(dataString);

    const attributes = extraction.attributes;
    const body = extraction.body;

    const $ = cheerio.load(md.render(body));
    const title = trim($('h1').first().text());

    return {
        title: title,
        type: 'md',
        markdown: body,
        body: $.html(),
        attributes: attributes
    };
};

const createResultFromHTML = function(data) {
    const dataString = data.toString();

    const $ = cheerio.load(dataString);
    const title = trim($('title').first().text());

    return {
        title: title,
        type: 'html',
        body: dataString
    };
};

module.exports = function(inputDirectory, cb) {
    const result = {};

    const walker = walk.walk(inputDirectory, {});

    walker.on('file', function (root, fileStats, next) {
        const extension = fileExtension(fileStats.name);

        if (extension != 'md' && extension != 'html') {
            return next();
        }

        const filePath = path.join(inputDirectory, fileStats.name);

        fs.readFile(filePath, function (err, data) {
            let fileResult;
            if (extension == 'md') {
                fileResult = createResultFromMarkdown(data);
            } else if (extension == 'html') {
                fileResult = createResultFromHTML(data);
            }

            if (!fileResult.title || result[fileResult.title]) {
                return next();
            }

            result[fileResult.title] = fileResult;

            next();
        });
    });

    walker.on('errors', function (root, nodeStatsArray, next) {
        next();
    });

    walker.on('end', function () {
        cb(null, result);
    });
}
