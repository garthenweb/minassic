var uglifyJS   = require('uglify-js2'),
    cleanCSS   = require('clean-css'),
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
        if(this.hasFlag('base64') || this.hasFlag('inline')) {
            // if base64/ inline the code is the filename
            cacheCompressFiles = this.cache.writeVirtual(codeList);
        } else {
            // else the code has to write to disc and a name is created
            cacheCompressFiles = this.cache.write(codeList);
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

        // if it is an image which will not be output as base64
        // nor should be inlined, just return the filepath
        var isImg = (type === 'img');
        if( isImg && !this.hasFlag('base64') && !this.hasFlag('inline') ) {
            return filepath;
        }

        // get the code of the file and return it to the new object
        // key is the filename, value the code
        var encoding = isImg ? null : 'utf8';
        return fs.readFileSync(this.cache.assets + glue + filepath, encoding);

    }, this);

};

/**
 * Minifies the code depending on the filetype
 */
Compressor.prototype.minify = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        switch(type) {
            case 'js':
                return uglifyJS.minify(code, {fromString: true}).code;
            case 'css':
                return cleanCSS.process(code);
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

        // do not concatenate if it is an image
        if(type === 'img') {
            concatedList[type] = files;
            return;
        }

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