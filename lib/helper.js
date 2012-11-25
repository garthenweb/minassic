var path = require('path'),
	_ 	 = require('underscore');

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

		if( _.has(obj2, key) ) {

			_.each(obj2[key], function(val2, key2) {

				retObj[key] = retObj[key] || {};
				retObj[key][key2] = val2;

			});
		}

	});

	_.each(obj2, function(val, key) {

		if( _.has(obj, key) ) {

			_.each(obj[key], function(val2, key2) {

				retObj[key] = retObj[key] || {};
				retObj[key][key2] = val2;

			});
		}

	});

	return retObj;

};