const _ = require('lodash');
const cheerio = require('cheerio');
const load = require('./load');
const beautify_html = require('js-beautify').html;
const fs = require('fs');
const slug = require('slug');

const output = {};

load('./input', function(err, pages) {
    const template = pages.template.body;
    const menu = pages.menu.body;

    _.keys(pages).forEach(function(key) {
        if (key != 'menu' && key != 'template') {
            const $ = cheerio.load(template);

            const page = pages[key];

            $('#content').html(page.body);
            $('#menu').html(menu);

            fs.writeFileSync('./output/'+slug(key)+'.html', beautify_html($.html()));
        }
    });
});
