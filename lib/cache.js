var fs         = require('fs'),
	path       = require('path'),
    _          = require('underscore'),
    md5        = require('MD5'),
    helper 	   = require('./helper.js');


module.exports = Cache;

function Cache(options) {

	this.CACHE  = {};
	this.assets = options.assets;
	this.cache  = options.cache;

}

Cache.prototype.distinguish = function(list, tags) {

    var cachedList            = {},
        uncachedList          = {},
        concatenate 		  = tags.indexOf('concatenate') !== -1,
        concatenatedFilenames = concatenate && helper.getCombinedNames(list, tags);

    // files will not be concatenated
    helper.mapList(list, function(type, value) {

        var isConcatenatedCache = (concatenate && this.isCached(type, concatenatedFilenames[type]));

        if( !concatenate && this.isCached(type, value) ) {

            cachedList[type] = cachedList[type] || [];
            cachedList[type].push(this.CACHE[type][value]);

        } else if(!isConcatenatedCache) {

            uncachedList[type] = uncachedList[type] || [];
            uncachedList[type].push(value);

        } else if(isConcatenatedCache) {

            cachedList[type] = Array(this.CACHE[type][concatenatedFilenames[type]]);

        }

    }, this);

    return {
        cached:   cachedList,
        uncached: uncachedList
    };

};

Cache.prototype.write = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        var ext        = path.extname(filepath);
        var filename   = path.basename(filepath, ext);
        var hash       = md5(code);

        var cachedFilename = filename + '_' + hash + ext;
        var cachedFilepath = this.cache + '/' + cachedFilename;


        this.CACHE[type] = this.CACHE[type] || [];
        // update cache variable to be earlier informed about already cached files
        this.CACHE[type][filepath] = cachedFilename;

        // check if new file already exists
        fs.exists(cachedFilepath, function(exists) {

            if(exists) { return; }

            fs.open(cachedFilepath, 'a', function(err, id) {
                fs.write(id, code, null, 'utf8', function() {
                    fs.close(id);
                });
            });

        });

        return cachedFilename;

    }, this);

};

Cache.prototype.isCached = function(type, key) {

    return !!( key !== undefined && this.CACHE[type] && this.CACHE[type][key] );

};