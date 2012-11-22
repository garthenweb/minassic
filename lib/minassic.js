var _          = require('underscore'),
    Compressor = require('./compressor.js'),
    Cache      = require('./cache.js'),
    helper     = require('./helper.js');

module.exports = Minassic;

function Minassic(options) {

    // default options
    this.options = {
        assets: __dirname + '/public',
        cache:  __dirname + '/public/cache',
        flags:  []
    };

    // extend costimized options
    this.options = _.extend(this.options, options);

    // create cache
    this.cache = new Cache({
        assets: this.options.assets,
        cache:  this.options.cache
    });

}

Minassic.prototype.parse = function(data) {

    // sort files by extension
    var files = helper.sortByExt(data.files);
    var flags = data.flags;

    // combine flags if it is an array/ not false
    if( _.isArray(this.options.flags) ) {
        flags = _.union(flags, this.options.flags);
    } else {
        flags = false;
    }

    var compressor = new Compressor({
        files: files,
        flags: flags,
        cache: this.cache
    });

    return compressor.compress();

};

Minassic.prototype.swig = function(args) {

    // first parameter includes the files
    // files are passed as string
    // to get a array the string has to eval
    var files = eval(args[0]);
    // save flags from args and remove all empty values
    var flags = _.compact((''+( args[1] || '' )).split('|'));

    // get the output as html
    var fileList = this.parse({
        files: files,
        flags: flags
    });

    var output = this.output(fileList);

    // pass the output as html to the swig template
    return '_output += "' + output + '";';

};

Minassic.prototype.output = function(fileList) {

    var output = '';
    helper.mapList(fileList, function(type, cachedFilepath) {

        switch(type) {
            case 'js':
                output += '<script src=\'' + cachedFilepath + '\'></script>';
                break;
            case 'css':
                output += '<link href=\'' + cachedFilepath + '\' rel=\'stylesheet\'>';
                break;
        }

    }, this);

    return output;

};