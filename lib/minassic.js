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

Minassic.prototype.output = function(fileList, customOutputTag) {

    var output = '';

    var outputTags = {
        js:  '<script src="@filepath"></script>',
        css: '<link href="@filepath" rel="stylesheet">'
    };

    helper.mapList(fileList, function(type, cachedFilepath) {

        var outputTag = customOutputTag || outputTags[type];
        output += outputTag.replace(/@filepath/g, cachedFilepath);

    }, this);

    return output;

};

/* Template engines
------------------------------------------------------------- */
// Swig
module.exports.swig = function(instance) {

    var swigFn = function(indent, parser) {
        return instance.swig(this, parser);
    };
    swigFn.ends = true;

    return swigFn;

};

Minassic.prototype.swig = function(data, parser) {

    var parsedFiles = parser.parseVariable(data.args[0]);
    // first parameter includes the files
    // files are passed as string
    // to get a array the string has to parse as JSON
    var files = JSON.parse(parsedFiles.name);
    // save flags from args and remove all empty values
    var flags = _.compact((''+( data.args[1] || '' )).split('|'));


    // get the output files as an array
    var fileList = this.parse({
        files: files,
        flags: flags
    });

    var output = this.output(fileList, data.tokens[0]);

    // escape output string and return it to swig 
    return '_output += "' + output.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/"/g, '\\"') + '";\n';

};