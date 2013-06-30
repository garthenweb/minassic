var fs         = require('fs'),
	path       = require('path'),
    _          = require('underscore'),
    md5        = require('MD5'),
    helper 	   = require('./helper.js');

module.exports = Cache;

/**
 * Cache Constructor for handling caching in the file system
 */
function Cache(options) {

	this.CACHE    = {};
	this.assets   = options.assets;
    this.cache    = options.cache;
	this.isActive = options.isActive;

    // check if the folder exists and create if not
    fs.exists(options.cache, function(exists) {

        if(!exists) fs.mkdir(options.cache, function() {
            console.log('Minassic: Directory "' + options.cache + '" was created for file caching.');
        });

    });

}

/**
 * Split files in already cached and not cached ones
 */
Cache.prototype.distinguish = function(list, tags) {

    var cachedList            = {},
        uncachedList          = {},
        concatenate 		  = tags && tags.indexOf('concatenate') !== -1,
        concatenatedFilenames = concatenate && helper.getCombinedNames(list, tags);

    // files will not be concatenated
    helper.mapList(list, function(type, value) {

        var isConcatenatedCache = (concatenate && this.isCached(type, concatenatedFilenames[type]));

        if( !isConcatenatedCache || !this.isActive ) {

            uncachedList[type] = uncachedList[type] || [];
            uncachedList[type].push(value);

        } else if( !concatenate && this.isCached(type, value) ) {

            cachedList[type] = cachedList[type] || [];
            cachedList[type].push(this.CACHE[type][value]);

        } else if( isConcatenatedCache ) {

            cachedList[type] = Array(this.CACHE[type][concatenatedFilenames[type]]);

        }

    }, this);

    return {
        cached:   cachedList,
        uncached: uncachedList
    };

};

/**
 * Write files to the cache
 */
Cache.prototype.write = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        // images are not rewriten to the filesystem
        // and are only stored in the virtual cache
        if(type === 'img') { return this.writeOneVirtual(type, code, filepath); }

        // all other files are writen to the file system
        return this.writeOneFS(type, code, filepath);

    }, this);

};

/**
 * Works the same way like write
 * but write only virtual and never to file system
 */
Cache.prototype.writeVirtual = function(list) {

    return helper.mapList(list, function(type, code, filepath) {

        return this.writeOneVirtual(type, code, filepath);

    }, this);

};

/**
 * Write one file into the file system
 * and into the virtual cache
 */
Cache.prototype.writeOneFS = function(type, code, filepath) {

    var ext = path.extname(filepath);
    // md5 the code in production
    // or use the basename and a md5 hash of the path
    var filename = this.isActive ? md5(code) : path.basename(filepath, ext) + '_' + md5(filepath);

    var cachedFilename = '/' + filename + helper.replaceExt(ext);
    var cachedFilepath = this.cache + cachedFilename;


    this.CACHE[type] = this.CACHE[type] || [];
    // update cache variable to be earlier informed about already cached files
    this.CACHE[type][filepath] = cachedFilename;

    var _write = function() {

        fs.open(cachedFilepath, 'w', function(err, id) {
            fs.write(id, code, null, 'utf8', function() {
                fs.close(id);
                console.log('Minassic: File "' + cachedFilename + '" was created in cache directory.');
            });
        });

    };

    if(this.isActive) {
        // check if new file already exists
        fs.exists(cachedFilepath, function(exists) {

            if(!exists) { _write(); }

        });

    } else {

        _write();

    }

    return cachedFilename;

};


/**
 * Only writes one file into the virtual cache
 */
Cache.prototype.writeOneVirtual = function(type, code, filepath) {

    this.CACHE[type] = this.CACHE[type] || [];
    // update cache variable to be earlier informed about already cached files
    this.CACHE[type][filepath] = code;

    return code;

};

/**
 * Checks whether the file is already cached
 */
Cache.prototype.isCached = function(type, key) {

    return !!( key !== undefined && this.CACHE[type] && this.CACHE[type][key] );

};