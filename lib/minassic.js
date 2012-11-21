var fs        = require('fs'),
    path      = require('path'),
    UglifyJS  = require('uglify-js2'),
    Csso      = require('csso'),
    md5       = require('md5'),
    _         = require('underscore');

module._cache = {};
module._options = {

    flags: [],
    assets: __dirname + '/../assets',
    cache:  __dirname + '/../cache'

};

exports.init = function(options) {

    module._options = _.extend(module._options, options);

};

exports.swig = function(indent, parentBlock, parser) {

    // first parameter includes the files
    // files are passed as string
    // to get a array the string has to eval
    var files       = eval(this.args[0]);
    // sort files by extension
    var sortedFiles = module.sortByExtension(files);

    // save flags from args
    var flags       = _.compact((''+( this.args[1] || '' )).split('|'));

    // combine flags if it is an array
    if(_.isArray(module._options.flags)) flags = _.union(flags, module._options.flags);

    // if no flags are given
    // or if default property is set to false
    // return the normal files
    if( _.isEmpty(flags) || module._options.flags === false ) {
        return '_output += "' + module.getOutputHTML(sortedFiles) + '";';
    }

    // sort files by extension and filter which are already in cache
    var splitedFiles  = module.splitCachedFiles(sortedFiles, (flags.indexOf('concatenate') !== -1));
    var uncachedFiles = splitedFiles.uncached;
    var cachedFiles   = splitedFiles.cached;

    // create output var and write already cached files into it
    var output = '';
    output += module.getOutputHTML(cachedFiles);

    // compress remaining files,
    // save them to the cache
    // and add them to the output
    if(!_.isEmpty(uncachedFiles)) {

        // saves the code in connecting to the filename
        var codeList = module.getCode(uncachedFiles);

        // start compressions
        // if required, first concatenate
        if(flags.indexOf('concatenate') !== -1) {
            codeList = module.concatenateCode(codeList);
        }
        if(flags.indexOf('minify') !== -1) {
            codeList = module.minifyCode(codeList);
        }

        // create html for new created cached files
        output += module.getOutputHTML(module.createCache(codeList));
    }

    // write the output to the swig template
    return '_output += "' + output + '";';

};

module.sortByExtension = function(unsortedList) {

    var sortedList = {};
    // get every filename and check whether it is an js or css file
    unsortedList.forEach(function(filename) {

        switch(path.extname(filename)) {

            case '.js':
                sortedList['js'] = sortedList['js'] || [];
                sortedList['js'].push(filename);
                break;

            case '.css':
                sortedList['css'] = sortedList['css'] || [];
                sortedList['css'].push(filename);
                break;

        }

    });

    return sortedList;

};

module.mapSortedList = function(sortedList, fn) {

    var types          = Object.keys(sortedList);
    var sortedCodeList = {};

    types.forEach(function(type) {

        var typeList = sortedList[type];
        sortedCodeList[type] = {};

        // dont know it it is an object or an array
        // get the keys and iterate over them
        var keys = Object.keys(typeList);
        var len = keys.length;

        for(i=0; i<len; i++) {

            var key   = keys[i];
            var value = typeList[key];

            if(_.isArray(typeList)) {
                sortedCodeList[type][value] = fn(type, value);
            } else {
                sortedCodeList[type][key] = fn(type, value, key);
            }

        }

    });

    // return the created object with all code files
    return sortedCodeList;

};

module.getCode = function(sortedList) {

    return module.mapSortedList(sortedList, function(type, filepath) {

        // check if the filepath is relativ to the root
        // else generate a glue for that
        var glue = (filepath.indexOf('/') === 0) ? '' : '/';

        // get the code of the file and return it to the new object
        // key is the filename, value the code
        return fs.readFileSync(module._options.assets + glue + filepath, 'utf8');

    });

};

module.minifyCode = function(sortedCodeList) {

    return module.mapSortedList(sortedCodeList, function(type, code, filepath) {

        switch(type) {
            case 'js':
                return UglifyJS.minify(code, {fromString: true}).code;
            case 'css':
                return Csso.justDoIt(code);
            default:
                return '';

        }

    });

};

module.concatenateCode = function(sortedCodeList) {

    var concatedList  = {};
    var combinedNames = module.getCombinedNames(sortedCodeList);

    _.each(sortedCodeList, function(files, type) {

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

module.createCache = function(sortedCodeList) {

    return module.mapSortedList(sortedCodeList, function(type, code, filepath) {

        var ext        = path.extname(filepath);
        var filename   = path.basename(filepath, ext);
        var hash       = md5(code);

        var cachedFilename = filename + '_' + hash + ext;
        var cachedFilepath = module._options.cache + '/' + cachedFilename;


        module._cache[type] = module._cache[type] || [];
        // update cache variable to be earlier informed about already cached files
        module._cache[type][filepath] = cachedFilename;

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

    });

};

module.getOutputHTML = function(sortedFinalList) {

    var output = '';
    module.mapSortedList(sortedFinalList, function(type, cachedFilepath) {

        switch(type) {
            case 'js':
                output += '<script src=\'' + cachedFilepath + '\'></script>';
                break;
            case 'css':
                output += '<link href=\'' + cachedFilepath + '\' rel=\'stylesheet\'>';
                break;
        }

    });

    return output;

};

module.splitCachedFiles = function(fileList, concatenate) {

    var cachedList            = {},
        uncachedList          = {},
        concatenatedFilenames = concatenate && module.getCombinedNames(fileList);

    // files will not be concatenated
    module.mapSortedList(fileList, function(type, value) {

        var isConcatenatedCache = (concatenate && module.isCached(type, concatenatedFilenames[type]));

        if( !concatenate && module.isCached(type, value) ) {

            cachedList[type] = cachedList[type] || [];
            cachedList[type].push(module._cache[type][value]);

        } else if(!isConcatenatedCache) {

            uncachedList[type] = uncachedList[type] || [];
            uncachedList[type].push(value);

        } else if(isConcatenatedCache) {

            cachedList[type] = Array(module._cache[type][concatenatedFilenames[type]]);

        }

    });

    return {
        cached:   cachedList,
        uncached: uncachedList
    };

};

module.isCached = function(type, key) {

    return !!( key !== undefined && module._cache[type] && module._cache[type][key] );

};

module.getCombinedNames = function(sortedFileList) {

    var sortedNameList = {};
    _.each(sortedFileList, function(files, type) {

        var filename = '';
        var isArray  = _.isArray(files);

        _.each(files, function(value, key) {

            filename += (isArray) ? value : key;

        });

        sortedNameList[type] = filename;

    });

    return sortedNameList;

};