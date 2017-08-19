const _ = require('lodash');
const load = require('./load');

load('./input', function(err, pages) {
    _.keys(pages).forEach(function(key) {
        console.log(pages[key]);
    });
});
