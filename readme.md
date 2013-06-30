# Minassic

## About ##

Minassic is a Node module to get assets optimized for the web without disturbing your development workflow.
You can minify, concatenate, inline and base64-stringify assets like CSS-, Javascript-files and images in production environment without the need to worry about it in your development process.

## Getting Started ##

Use npm to install the package:

```bash
npm install minassic
```

## Setting up ##

```javascript
var Minassic = require('minassic');
var minassic = new Minassic({
	assets: __dirname + '/public',
	cache:  __dirname + '/public/cache',
	flags: ['minify', 'concatenate', 'inline', 'base64', 'preprocess'],
	disableCache: true
});
```

* `assets` is the location relative to all assets.
* `cache` is the location where the compressed files will be saved.
* `flags` is an array of flags which will always be passed to all files. By default it is an empty array. You can also set it to `false` to disable all flags everywhere. This can be usefull in development environment.
* `disableCache` is a boolean value to define whether the files are compiled on each request or just once at the beginning. By default it is set to `false` to enable caching.

The server has to serve files directly from the cache folder. With Express it could look like this:

```javascript
var express  = require('express');
var app 	 = express();

app.use(express.static(__dirname + '/public/cache', { maxAge: 311040000 }));
app.use(express.static(__dirname + '/public'));
```

## Swig Templating ##

```javascript
var swig = require('swig');
swig.init({
	tags: {
		minassic: Minassic.swig(minassic)
	}
});

```
Insert the `Minassic.swig` function into the tags object. The key can be whatever you like to, but remember it is later on used in the template. Important: The `Minassic.swig` function needs to get a Minassic-instance as its first parameter.

``` html
{% minassic ["/dir/to/style.css", "/dir/to/other/style.css"] minify concatenate %}{% endminassic %}
```
This will get the code from both files, minify and concatenate them and output it in a link attribute:

```html
<link href="/e1f12bb7dac3422122922c99cf92bd07.css" rel="stylesheet">
```

The `minify` and `concatenate` flags in this example could be removed if they are specified in the flags array while creating the Minassic object.

If you need a custom output format it is possible to define it between the `minassic` tag.

```html
{% minassic ["/dir/to/style.css", "/dir/to/other/style.css"] minify concatenate %}
	<link href="@output" rel="stylesheet" media="screen">
{% endminassic %}
```
`@output` will be replaced with the generated filename or if the flag `inline` is used with the string.

Flags can also be combined. So it is for example possible to combine three flags like `minify concatenate inline`. 

## Custom Templating ##
All other template engiens could be served with cached files by running the following:
``` javascript
// will return an array of files
var files = minassic.run({
    files: ['some.css', 'files.css'],
    flags: ['inline']
});

// will return the html tags as a string
var output = minassic.output(files, {
    customTag: '<style>@output</style>', // is optional
    inline:    true // false if you like to use the default html and the files aren't inlined
});
```

## Grab all files in directory ##
If you'd like to get all files (recursively) in one folder, you can insert `/folder/*` into the files-array.

## Flags ##
* `minify` will minify css code by [clean-css](https://github.com/GoalSmashers/clean-css) library and js code by [UglifyJS2](https://github.com/mishoo/UglifyJS2). It will not have any effect to images
* `concatenate` will join together all assets given in the map, but will distinguish between file types. It will not have any effect to images
* `inline` will output the plain text in the file
* `base64` will create an base64 string from the source and output it for a src-attribute
* `preprocess` will check for a precompiler task based on the file extension. Fine more information on [Preprocessors](#preprocessors) section

## Output ##

By default Minassic is using the following output formates:

```html
<!-- CSS -->
<link href="@output" rel="stylesheet">
<!-- CSS inline -->
<style>@output</style>
<!-- Javascript -->
<script src="@output"></script>
<!-- Javascript inline -->
<script>@output</script>
<!-- Images inline -->
<img src="@output" alt="">
```

## Preprocessors ##

The `preprocess` flag will ignore if flags are globaly disabled, so that it will work in development envirnonment, too.
At the moment just Sass via [node-sass](https://github.com/andrew/node-sass) is supported.
I like to add more preprocessors in future. If you have requests to special compilers, I will try to considerate them. Just open an issue in the [issue section](https://github.com/garthenweb/minassic/issues).

### Sass ###

.sass or .scss extension will trigger the sass compiler when `preprocess` flag is set:
```html
{% minassic ["/dir/to/scss.scss", "/dir/to/other/scss.scss"] minify concatenate preprocess %}
	<link href="@output" rel="stylesheet" media="screen">
{% endminassic %}
```
Thanks to [sasslib](https://github.com/hcatlin/libsass) no ruby is required to run the compilation.
A working example can be found on the [examples folder](https://github.com/garthenweb/minassic/tree/master/examples).

## More Examples ##

Working examples for swig and sass can be found in the [examples folder](https://github.com/garthenweb/minassic/tree/master/examples).

## Feedback and Bugs ##

I love to hear your feedback, please don't hesitate to send me an email!
If you find any bugs, please report them at the issue section or fix them and just start a pull request.

Please be sure that this project is in early stage and may contain bugs.

## Migration Notes ##

* v0.3 introduces precompilers. Because of this, a new configuration option was added to enable or disable the cache after the first request per file. By default the `disableCache` option is set to `false`. If your files are just compiled at the first request, turn the option to `true` in development mode. Be sure that this option is set to `false` in production mode to reduce stress on your server!

## Known Bugs ##

* Inlining big files is not a good idea because the server will save it in memory and garbage collection can never clean it up. Moreover, if you even try to inline big files like jQuery you will get an error by now.

## License ##

Licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php).