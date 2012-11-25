# Minassic

## About ##

Minassic is a Node module to get assets optimized for the web without disturbing your development workflow.
You can minify, concatenate, inline and base64-stringify assets like CSS-, Javascript-files and images in production environment without the need to worry about it in your development process.

## Getting Started ##

Use npm to install the package:

```bash
npm install minassic
```

### Setting up

```javascript
var Minassic = require('minassic');
var minassic = new Minassic({
	assets: __dirname + '/public',
	cache:  __dirname + '/public/cache',
	flags: ['minify', 'concatenate', 'inline', 'base64']
});
```

* `assets` is the location relative to all assets.
* `cache` is the location where the compressed files will be saved.
* `flags` is an array of flags which will always be passed to all files. By default it is an empty array. You can also set it to `false` to disable all flags globally. This can be usefull in development environment.

The server has to serve files directly from the cache folder. With Express it could look like this:

```javascript
var express  = require('express');
var app 	 = express();

app.use(express.static(__dirname + '/public/cache', { maxAge: 311040000 }));
app.use(express.static(__dirname + '/public'));
```

### Swig Templating

```javascript
swig.init({
	tags: {
		minassic: Minassic.swig(minassic)
	}
});

```
Insert the `Minassic.swig` function into the tags object. The key can be whatever you like to, but remember it is later on used in the template. Important: The `Minassic.swig` function needs to get a Minassic-instance as its first parameter.

``` html
{% minassic ["/dir/to/style.css", "/dir/to/other/style.css"] minify|concatenate %}{% endminassic %}
```
This will get the code from both files, minify and concatenate them and output it in a link attribute:

```html
<link href="/style_e1f12bb7dac3422122922c99cf92bd07.css" rel="stylesheet">
```

The `minify` and `concatenate` flags in this example could be removed if they are specified in the flags array while creating the Minassic object.

If you need a custom output format it is possible to define it between the `minassic` tag.

```html
{% minassic ["/dir/to/style.css", "/dir/to/other/style.css"] minify|concatenate %}
	<link href="@file" rel="stylesheet" media="screen">
{% endminassic %}
```
´@file´ will be replaced with the generated filename or if the flag `inline` is used with the string.

### Custom Templating
All other template engiens could be served with cached files by running the following:
``` javascript
// will return an array of files
var files = minassic.run({
    files: ['some.css', 'files.css',
    flags: ['inline']
});

// will return the html tags as a string
var output = minassic.output(files, {
    customTag: '<style>@file</style>', // is optional
    inline:    true // false if you like to use the default html and the files aren't inlined
});
```

### Output
By default Minassic is using the following output formates:

```html
<!-- CSS -->
<link href="@file" rel="stylesheet">
<!-- CSS inline -->
<style>@file</style>
<!-- Javascript -->
<script src="@file"></script>
<!-- Javascript inline -->
<script>@file</script>
<!-- Images inline -->
<img src="@file" alt="">
```

### More Examples

Working examples can be found in the example section.

### Feedback and Bugs

I love to here your feedback, please don't hesitate to send me an email!
If you found any bugs, please report them at the issue section or fix them and just start a pull request.

Please be sure that this project is in early stage and can contain bugs.