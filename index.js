const fs = require('fs');
const cheerio = require('cheerio');
const _ = require('lodash');

const input = fs.readFileSync('./input.md').toString();
const base = fs.readFileSync('./base.html').toString();


const markdownItAttrs = require('markdown-it-attrs');
const md = require('markdown-it')();

const beautify_html = require('js-beautify').html;

md.use(require('markdown-it-container'), 'area', {

    validate: function(params) {
        return params.trim().match(/^area\s+(.*)$/);
    },

    render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^area\s+(.*)$/);

        if (tokens[idx].nesting === 1) {
            // opening tag
            return '<div style="grid-area: '+m[1]+';">\n';

        } else {
            // closing tag
            return '</div>\n';
        }
    }
});

md.use(markdownItAttrs);

const result = md.render(input);

const $ = cheerio.load(base.replace('!CONTENT!', result));

$('p').each(function(i, elem) {
    const attribs = this.attribs;
    const component = this.attribs['component'];
    if (component) {
        const node = $('<'+component+'></'+component+'>');
        node.html($(this).html());

        _.keys(attribs).forEach(function(key) {
            if (key == 'component') {
                return;
            }

            node.attr(key, attribs[key]);
        });

        $(this).replaceWith(node);
    }
});

$.html();

fs.writeFileSync('./output.html', beautify_html(base.replace('!CONTENT!', $.html())));
