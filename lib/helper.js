var path = require('path'),
	_ 	 = require('underscore'),
    fs   = require('fs');

/**
 * Iterates over an two dimensional object
 * and calls for every child a function.
 * The return of the function is saved to a
 * new object which will be returned
 */
module.exports.mapList = function(list, fn, _this) {

    var types    = Object.keys(list);
    var mapedList = {};

    types.forEach(function(type) {

        var typedList = list[type];
        mapedList[type] = {};

        // get the keys and iterate over them
        var keys = Object.keys(typedList);
        var len = keys.length;

        for(i=0; i<len; i++) {

            var key   = keys[i];
            var value = typedList[key];

            // if it is an array use the value as the key for the new object
            // else use the existing key
            if(_.isArray(typedList)) {
                mapedList[type][value] = fn.call(_this, type, value);
            } else {
                mapedList[type][key] = fn.call(_this, type, value, key);
            }

        }

    });

    // return the created object with all code files
    return mapedList;

};

/**
 * Combine all properties of each type to an key
 * for the cache.
 */
module.exports.getCombinedNames = function(sortedFileList, tags) {

    var sortedNameList = {};

    _.each(sortedFileList, function(files, type) {

        var filename = '';
        var isArray  = _.isArray(files);

        // flags need to be added to the name
        // so every algorithm get its own
        // property in the cache and
        // is unique
        if(tags) {
            tags.forEach(function(name) {
                filename += name;
            });
        }

        _.each(files, function(value, key) {

            filename += (isArray) ? value : key;

        });

        sortedNameList[type] = filename;

    });

    return sortedNameList;

};
/**
 * Sort all files by its type based on the extension
 */
module.exports.sortByExt = function(list) {

    var sortedList = {};
    // get every filename and check whether it is an js or css file
    list.forEach(function(filename) {

        var ext = path.extname(filename).substr(1).toLowerCase();


        if(ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'svg') {

            sortedList['img'] = sortedList['img'] || [];
            sortedList['img'].push(filename);

        } else {

            sortedList[ext] = sortedList[ext] || [];
            sortedList[ext].push(filename);

        }

    });

    return sortedList;

};
/**
 * Merge two two-dimensional objects into one
 */
module.exports.merge = function(obj, obj2) {

	var retObj = {};

	_.each(obj, function(val, key) {

		_.each(obj[key], function(val2, key2) {

			retObj[key] = retObj[key] || {};
			retObj[key][key2] = val2;

		});

	});

	_.each(obj2, function(val, key) {

		_.each(obj2[key], function(val2, key2) {

			retObj[key] = retObj[key] || {};
			retObj[key][key2] = val2;

		});

	});

	return retObj;

};

/**
 * Replaces all dirs with an star at the end with all containing files in the folder
 */
module.exports.replaceStarDir = function(files, root) {

    // array to sore new files in
    var replacedFiles = _.clone(files);
    var newIndex      = 0;

    files.forEach(function(file, index) {

        if(file.lastIndexOf('/*') !== -1) {

            // get the dir without the star
            var dir = file.substr(0,file.length-1);

            // get all files in the folder and push them to the array
            var filesInDir = module.exports.walkSync(root + '/' + dir);
            
            var filesWithPath = filesInDir.map(function(fileInDir) {

                fileInDir = path.normalize(fileInDir).substring(path.normalize(root).length, path.normalize(fileInDir).length);
                return fileInDir.split(path.sep).join('/');

            });

            // return the original file from array and add the new ones
            filesWithPath.unshift(newIndex + index, 1);
            Array.prototype.splice.apply(replacedFiles, filesWithPath);

            // add new files to index
            // minor 2 because we add two values for apply function
            // minor 1 because one item is removed anyway
            newIndex = newIndex + filesWithPath.length - 2 - 1;

        }

    });

    // merge arrays ant return
    return replacedFiles;

};

/**
 * walks recursive from a dir and returns all files
 * @source      http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search#tab-top
 */
module.exports.walkSync = function walkSync(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    var pending = list.length;

    if (!pending) return done(null, results);

    list.forEach(function(file) {

        file = dir + '/' + file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {

            var res = walkSync(file);
            results = results.concat(res);
            if (!--pending) return results;

        } else {

            results.push(file);
            if (!--pending) return results;

        }

    });

    return results;

};