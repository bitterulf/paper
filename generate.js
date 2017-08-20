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

    let links = [];

    _.keys(pages).forEach(function(key) {
        if (key != 'menu' && key != 'template') {
            const page = pages[key];

            links.push({
                title: page.title,
                href: slug(key)+'.html'
            });
        }
    });

    const $menu = cheerio.load(menu);

    const firstMenu = $menu('ul').first();

    firstMenu.html(
        firstMenu.html()
        +'<li>'
        +links.map(function(link) { return '<a href="'+link.href+'">'+link.title+'</a>'}).join('')
        +'</li>'
    );

    _.keys(pages).forEach(function(key) {
        if (key != 'menu' && key != 'template') {

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

            const parts = $page.html().split('<hr>');

            parts.forEach(function(part, index) {
                const $ = cheerio.load(template);

                let pagination = '';

                if (index == 0) {
                    _.times(parts.length-1, function(index) {
                        pagination+= '<li><a href="'+ slug(key)+'-'+(index+1)+'.html' +'">'+(index+1)+'</li></a>';
                    });

                    pagination = '<ul>' + pagination + '</ul>';

                    part += pagination;
                }
                else {
                    pagination+= '<li><a href="'+ slug(key)+'.html' +'">back</li></a>';

                    pagination = '<ul>' + pagination + '</ul>';

                    part += pagination;
                }

                $('#content').html(part);
                $('#menu').html($menu.html());

                const filename = index == 0 ? slug(key)+'.html' : slug(key)+'-'+index+'.html';

                fs.writeFileSync('./output/'+filename, beautify_html($.html()));
            });
        }
    });
});
