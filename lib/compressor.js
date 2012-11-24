var UglifyJS   = require('uglify-js2'),
    Csso       = require('csso'),
    mime       = require('mime'),
    fs         = require('fs'),
    _          = require('underscore'),
    helper 	   = require('./helper.js');

module.exports = Compressor;

/**
 * Constructor for the compressor handling
 */
function Compressor(data) {

    this.files = data.files;
    this.flags = data.flags;
    this.cache = data.cache;

    this.compressedFiles = [];

}

/**
 * Compress all files with the given flags 
 */
Compressor.prototype.compress = function() {

    // if no flags are given
    // return the normal files
    if( _.isEmpty(this.flags) ) {
        return this.files;
    }

    // distinguish files that are and arent in cache
    var splittedList = this.cache.distinguish(this.files, this.flags);

    // add cached files to the output array
    this.compressedFiles = splittedList['cached'];

    // compress remaining files,
    // save them to the cache
    // and add them to the output
    if(!_.isEmpty(splittedList['uncached'])) {

        // saves the code in connecting to the filename
        var codeList = this.getCode(splittedList['uncached']);

        // start compressions
        // if required, first concatenate
        if(this.hasFlag('concatenate')) {
            codeList = this.concatenate(codeList);
        }
        if(this.hasFlag('minify')) {
            codeList = this.minify(codeList);
        }
        if(this.hasFlag('base64')) {
            codeList = this.base64(codeList);
        }

        // write files into the cache and return names
        var cacheCompressFiles;
        if(this.hasFlag('base64')) {
            // if base64 string the code is the filename
            cacheCompressFiles = this.cache.writeCode(codeList);
        } else {
            // else the code has to write to disc and a name is created
            cacheCompressFiles = this.cache.writeName(codeList);
        }

        // merge new created with already compressed files
        this.compressedFiles = helper.merge(cacheCompressFiles, this.compressedFiles);

    }

    return this.compressedFiles;

};

/**
 * Checks if the flag is given in the flags object
 */
Compressor.prototype.hasFlag = function(name) {

	return (this.flags.indexOf(name) !== -1);

};

/**
 * Get the code from the filesystem and returns it
 */
Compressor.prototype.getCode = function(list) {

    return helper.mapList(list, function(type, filepath) {

        // check if the filepath is relativ to the root
        // else generate a glue for that
        var glue = (filepath.indexOf('/') === 0) ? '' : '/';

        // get the code of the file and return it to the new object
        // key is the filename, value the code
        return fs.readFileSync(this.cache.assets + glue + filepath, 'utf8');

    }, this);

};

/**
 * Minifies the code depending on the filetype
 */
Compressor.prototype.minify = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        switch(type) {
            case 'js':
                return UglifyJS.minify(code, {fromString: true}).code;
            case 'css':
                return Csso.justDoIt(code);
            default:
                return code;

        }

    }, this);

};

/**
 * Concatenates all files of each type together
 */
Compressor.prototype.concatenate = function(list) {

    var concatedList  = {};
    var combinedNames = helper.getCombinedNames(list, this.flags);

    _.each(list, function(files, type) {

        var code     = '',
            filename = combinedNames[type];

        _.each(files, function(_code, _filename) {

            code += _code;

        });

        concatedList[type]           = {};
        concatedList[type][filename] = code;

    });

    return concatedList;

};

/**
 * Make an base64 string for inlining the file
 */
Compressor.prototype.base64 = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        // get mimetype
        var mimetype     = mime.lookup(filepath);
        var base64string = new Buffer(code).toString('base64');

        return 'data:' + mimetype + ';base64,' + base64string;

    }, this);

};