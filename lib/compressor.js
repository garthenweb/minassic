var UglifyJS   = require('uglify-js2'),
    Csso       = require('csso'),
    fs         = require('fs'),
    _          = require('underscore'),
    helper 	   = require('./helper.js');

module.exports = Compressor;

function Compressor(data) {

    this.files = data.files;
    this.flags = data.flags;
    this.cache = data.cache;

    this.compressedFiles = [];

}

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

        // write files into the cache and return names
        var cacheCompressFiles = this.cache.write(codeList);

        // merge new created with already compressed files
        this.compressedFiles = helper.merge(cacheCompressFiles, this.compressedFiles);

    }

    return this.compressedFiles;

};

Compressor.prototype.hasFlag = function(name) {

	return (this.flags.indexOf(name) !== -1);

};

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

Compressor.prototype.minify = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        switch(type) {
            case 'js':
                return UglifyJS.minify(code, {fromString: true}).code;
            case 'css':
                return Csso.justDoIt(code);
            default:
                return '';

        }

    }, this);

};

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