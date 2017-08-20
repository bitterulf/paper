const _ = require('lodash');
const cheerio = require('cheerio');
const load = require('./load');
const beautify_html = require('js-beautify').html;
const fs = require('fs');
const slug = require('slug');

const output = {};

const wrappElements = function($page, list, tag) {
    $page(tag).each(function(index) {
        if (!list[index]) {
            return;
        }

        const tagName = list[index];

        const wrapped = $page('<'+tagName+'>'+$page.html(this)+'</'+tagName+'>');
        $page(this).replaceWith(wrapped);
    });
};

load('./input', function(err, pages) {
    const template = pages.template.body;
    const menu = pages.menu.body;

    _.keys(pages).forEach(function(key) {
        if (key != 'menu' && key != 'template') {
            const $ = cheerio.load(template);

            const page = pages[key];

            const $page = cheerio.load(page.body);

            if (page.attributes.ul) {
                wrappElements($page, page.attributes.ul, 'ul');
            }
            if (page.attributes.ol) {
                wrappElements($page, page.attributes.ol, 'ol');
            }
            if (page.attributes.table) {
                wrappElements($page, page.attributes.table, 'table');
            }

            $('#content').html($page.html());
            $('#menu').html(menu);

            fs.writeFileSync('./output/'+slug(key)+'.html', beautify_html($.html()));
        }
    });
});
