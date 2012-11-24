var path = require('path'),
	_ 	 = require('underscore');

module.exports.mapList = function(list, fn, _this) {

    var types    = Object.keys(list);
    var mapedList = {};

    types.forEach(function(type) {

        var typedList = list[type];
        mapedList[type] = {};

        // dont know it it is an object or an array
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

module.exports.getCombinedNames = function(sortedFileList, tags) {

    var sortedNameList = {},
        minify      = tags.indexOf('minify') !== -1,
        concatenate = tags.indexOf('concatenate') !== -1,
        inline      = tags.indexOf('inline') !== -1,
    	base64      = tags.indexOf('base64') !== -1;

    _.each(sortedFileList, function(files, type) {

        var filename = '';
        var isArray  = _.isArray(files);

        // some flags need to add because without,
        // once the files are cached
        // the system cant handle changes
        filename += minify ? 'minify' : '';
        filename += concatenate ? 'base64' : '';
        filename += inline ? 'inline' : '';
        filename += base64 ? 'base64' : '';

        _.each(files, function(value, key) {

            filename += (isArray) ? value : key;

        });

        sortedNameList[type] = filename;

    });

    return sortedNameList;

};

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