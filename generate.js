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

const ignoreList = ['home', 'menu', 'template', 'address', 'links'];

load('./input', function(err, pages) {
    const template = pages.template.body;
    const menu = pages.menu.body;
    const address = pages.address.body;
    const linksPage = pages.links.body;
    const homePage = pages.home.body;

    let links = [];

    _.keys(pages).forEach(function(key) {
        if (ignoreList.indexOf(key) < 0) {
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
        if (ignoreList.indexOf(key) < 0) {

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
                        pagination+= '<li><a href="'+ slug(key)+'-'+(index+1)+'.html' +'">part'+(index+1)+'</li></a>';
                    });

                    pagination = '<ul>' + pagination + '</ul>';

                    part += pagination;
                }
                else {
                    pagination+= '<li><a href="'+ slug(key)+'.html' +'">overview</li></a>';

                    if (index > 1) {
                        pagination+= '<li><a href="'+ slug(key)+'-'+ (index - 1) +'.html' +'">prev</li></a>';
                    }
                    if (index < parts.length - 1) {
                        pagination+= '<li><a href="'+ slug(key)+'-'+ (index + 1) +'.html' +'">next</li></a>';
                    }

                    pagination = '<ul>' + pagination + '</ul>';

                    part = '<h1>' + key + ' - ' + index + '</h1>'+ part + pagination;
                }

                $('#content').html(part);
                $('#menu').html($menu.html());
                $('#address').html(address);
                $('#links').html(linksPage);

                const filename = index == 0 ? slug(key)+'.html' : slug(key)+'-'+index+'.html';

                fs.writeFileSync('./output/'+filename, beautify_html($.html()));
            });
        }
    });

    const $ = cheerio.load(template);
    $('#content').html(homePage);
    $('#menu').html($menu.html());
    $('#address').html(address);
    $('#links').html(linksPage);

    fs.writeFileSync('./output/index.html', beautify_html($.html()));
});
