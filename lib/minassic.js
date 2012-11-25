var _          = require('underscore'),
    Compressor = require('./compressor.js'),
    Cache      = require('./cache.js'),
    helper     = require('./helper.js');

module.exports = Minassic;

/**
 * Constructor for all Minassic handling
 */
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

/**
 * Creates an compressor and compress all files with given flags
 */
Minassic.prototype.run = function(data) {

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

/**
 * Inserts the filenames into an html tag
 */
Minassic.prototype.output = function(fileList, options) {

    var output = '';

    var outputTags = {
        js:        '<script src="@file"></script>',
        inlinejs:  '<script>@file</script>',
        css:       '<link href="@file" rel="stylesheet">',
        inlinecss: '<style>@file</style>',
        img:       '<img src="@file" alt="">'
    };

    helper.mapList(fileList, function(type, cachedFilepath) {

        // if the output file is inlined some elements are changing
        var prefix = (options.inline && this.options.flags) ? 'inline': '';
        var outputTag = options.customTag || outputTags[prefix + type];
        
        output += outputTag.replace(/@file/g, cachedFilepath);

    }, this);

    return output;

};

/* Swig engine
------------------------------------------------------------- */
/**
 * Function to pass into the swig tags object
 */
module.exports.swig = function(instance) {

    var swigFn = function(indent, parser) {
        return instance.swig(this, parser);
    };
    swigFn.ends = true;

    return swigFn;

};

/**
 * Converts the data from swig, calls the compression and returns a string for the swig api
 */
Minassic.prototype.swig = function(data, parser) {

    var parsedFiles = parser.parseVariable(data.args[0]);
    // first parameter includes the files
    // files are passed as string
    // to get a array the string has to parse as JSON
    var files = JSON.parse(parsedFiles.name);
    // save flags from args and remove all empty values
    var flags = _.compact((''+( data.args[1] || '' )).split('|'));

    // get the output files as an array
    var fileList = this.run({
        files: files,
        flags: flags
    });

    // create the output html tags
    var output = this.output(fileList, {
        customTag: data.tokens[0],
        inline:    flags.indexOf('inline') !== -1
    });

    // escape output string and return it to swig 
    return '_output += "' + output.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/"/g, '\\"') + '";\n';

};