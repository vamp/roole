'use strict'

var assert = {}

assert.compileTo = function(imports, input, css) {
	var called = false

	if (typeof imports !== 'object') {
		css = input
		input = imports
		imports = {}
	}

	var options = {
		imports: imports,
		prettyError: true
	}

	roole.compile(input, options, function(error, output) {
		called = true

		if (error)
			throw error

		if (output !== css) {
			error = new Error('')
			error.actual = output
			error.expected = css

			output = output ? '\n"""\n' + output + '\n"""\n' : ' ' + output + '\n'
			css = css ? '\n"""\n' + css + '\n"""' : ' empty string'
			error.message = 'input compiled to' + output + 'instead of' + css

			throw error
		}
	})

	if (!called)
		throw new Error('input is never compiled')
}

assert.failAt = function(imports, input, line, column, filePath) {
	var called = false

	if (typeof imports !== 'object') {
		filePath = column
		column = line
		line = input
		input = imports
		imports = {}
	}

	if (!filePath)
		filePath = ''

	var options = {imports: imports}

	roole.compile(input, options, function(error, css) {
		if (!error)
			throw new Error('no error is thrown')

		if (!error.line)
			throw error

		called = true

		if (error.line !== line)
			throw new Error('error has line number ' + error.line + ' instead of ' + line)

		if (error.column !== column)
			throw new Error('error has column number ' + error.column + ' instead of ' + column)

		if (error.filePath !== filePath)
			throw new Error('error has file path ' + error.filePath + ' instead of ' + filePath)
	})

	if (!called)
		throw new Error('input is never compiled')
}
suite('indent');

test('empty input', function() {
  return assert.compileTo('', '');
});

test('pure spaces input', function() {
  return assert.compileTo('  ', '');
});

test('under-indent', function() {
  return assert.compileTo('body\n		width: auto\n	height: auto', 'body {\n	width: auto;\n	height: auto;\n}');
});

test('over-indent', function() {
  return assert.compileTo('body\n	width: auto\n	div\n			height: auto', 'body {\n	width: auto;\n}\n	body div {\n		height: auto;\n	}');
});

test('start with indent', function() {
  return assert.compileTo('\tbody\n\t\twidth: auto\n\t\theight: auto', 'body {\n	width: auto;\n	height: auto;\n}');
});

suite('comment');

test('single-line commnet', function() {
  return assert.compileTo('// before selector\nbody // selctor\n// after selector\n	// before property\n	width: auto // property\n	// after property\n// outdent\n	height: auto // before eof', 'body {\n	width: auto;\n	height: auto;\n}');
});

test('multi-line commnet', function() {
  return assert.compileTo('/* license */\n\nbody\n	margin: 0', '/* license */\n\nbody {\n	margin: 0;\n}');
});

suite('selector');

test('multi-line selectors', function() {
  return assert.compileTo('div\np\n	width: auto', 'div,\np {\n	width: auto;\n}');
});

test('single-line selectors', function() {
  return assert.compileTo('div, p\n	width: auto', 'div,\np {\n	width: auto;\n}');
});

test('mixed-line selectors', function() {
  return assert.compileTo('body\ndiv, p\n	width: auto', 'body,\ndiv,\np {\n	width: auto;\n}');
});

test('nest selector under selector', function() {
  return assert.compileTo('body\n	div\n		width: auto', 'body div {\n	width: auto;\n}');
});

test('nest & selector under selector', function() {
  return assert.compileTo('body\n	&\n		width: auto', 'body {\n	width: auto;\n}');
});

test('nest selector containing & selector under selector', function() {
  return assert.compileTo('body\n	html &\n		width: auto', 'html body {\n	width: auto;\n}');
});

test('nest selector starting with combinator under selector', function() {
  return assert.compileTo('body\n	> div\n		width: auto', 'body > div {\n	width: auto;\n}');
});

test('nest selector list under selector', function() {
  return assert.compileTo('body div\n	p, img\n		width: auto', 'body div p,\nbody div img {\n	width: auto;\n}');
});

test('nest selector list containing & selector under selector', function() {
  return assert.compileTo('body div\n	&, img\n		width: auto', 'body div,\nbody div img {\n	width: auto;\n}');
});

test('nest selector under selector list', function() {
  return assert.compileTo('html, body\n	div\n		width: auto', 'html div,\nbody div {\n	width: auto;\n}');
});

test('nest & selector under selector list', function() {
  return assert.compileTo('html, body\n	&\n		width: auto', 'html,\nbody {\n	width: auto;\n}');
});

test('nest selector containing & selector under selector list', function() {
  return assert.compileTo('body, div\n	html &\n		width: auto', 'html body,\nhtml div {\n	width: auto;\n}');
});

test('nest selector starting with combinator under selector list', function() {
  return assert.compileTo('body, div\n	> p\n		width: auto', 'body > p,\ndiv > p {\n	width: auto;\n}');
});

test('nest selector list under selector list', function() {
  return assert.compileTo('html, body\n	p, img\n		width: auto', 'html p,\nhtml img,\nbody p,\nbody img {\n	width: auto;\n}');
});

test('nest selector list containing & selector under selector list', function() {
  return assert.compileTo('html, body\n	&, img\n		width: auto', 'html,\nhtml img,\nbody,\nbody img {\n	width: auto;\n}');
});

test('nest selector list containing selector starting with combinator under selector list', function() {
  return assert.compileTo('body, div\n	> p, img\n		width: auto', 'body > p,\nbody img,\ndiv > p,\ndiv img {\n	width: auto;\n}');
});

test('deeply nested selector', function() {
  return assert.compileTo('html\n	body\n		div\n			width: auto', 'html body div {\n	width: auto;\n}');
});

test('not allow & selector at the top level', function() {
  return assert.failAt('&\n	width: auto', 1, 1);
});

test('interpolating selector', function() {
  return assert.compileTo('$sel = \' body \'\n$sel\n	width: auto', 'body {\n	width: auto;\n}');
});

test('not allow interpolating invalid selector', function() {
  return assert.failAt('$sel = \'body @\'\n$sel\n	width: auto', 2, 1);
});

test('not allow interpolating & selector at the top level', function() {
  return assert.failAt('$sel = \'&\'\n$sel\n	width: auto', 2, 1);
});

test('interpolating selector inside selector', function() {
  return assert.compileTo('$sel = \'div \'\nbody $sel\n	width: auto', 'body div {\n	width: auto;\n}');
});

test('interpolating selector staring with combinator inside selector', function() {
  return assert.compileTo('$sel = \' >  div\'\nbody $sel\n	width: auto', 'body > div {\n	width: auto;\n}');
});

test('not allow interpolating & selector inside selector at the top level', function() {
  return assert.failAt('$sel = \'& div\'\nbody $sel\n	width: auto', 2, 6);
});

test('interpolating selector containing & selector and nested under selector', function() {
  return assert.compileTo('$sel = \'& div\'\nbody\n	html $sel\n		width: auto', 'html body div {\n	width: auto;\n}');
});

test('not allow interpolating selector list inside selector', function() {
  return assert.failAt('$sel = \'div, p\'\nbody $sel\n	width: auto', 2, 6);
});

test('interpolate identifier', function() {
  return assert.compileTo('$sel = div\n$sel\n	width: auto', 'div {\n	width: auto;\n}');
});

test('universal selector', function() {
  return assert.compileTo('*\n	margin: 0', '* {\n	margin: 0;\n}');
});

test('attribute selector', function() {
  return assert.compileTo('input[type=button]\n	margin: 0', 'input[type=button] {\n	margin: 0;\n}');
});

test('attribute selector without value', function() {
  return assert.compileTo('input[hidden]\n	margin: 0', 'input[hidden] {\n	margin: 0;\n}');
});

test('pseudo selector', function() {
  return assert.compileTo(':hover\n	text-decoration: underline', ':hover {\n	text-decoration: underline;\n}');
});

test('double-colon pseudo selector', function() {
  return assert.compileTo('a::before\n	content: \' \'', 'a::before {\n	content: \' \';\n}');
});

test('multi-line pseudo selector', function() {
  return assert.compileTo('body\n	a:hover\n	span:hover\n		text-decoration: underline', 'body a:hover,\nbody span:hover {\n	text-decoration: underline;\n}');
});

suite('property');

test('multi-line properties', function() {
  return assert.compileTo('body\n	width: auto\n	height: auto', 'body {\n	width: auto;\n	height: auto;\n}');
});

test('single-line properties', function() {
  return assert.compileTo('body\n	width: auto; height: auto', 'body {\n	width: auto;\n	height: auto;\n}');
});

test('mixed-line properties', function() {
  return assert.compileTo('body\n	width: auto; height: auto\n	float: left', 'body {\n	width: auto;\n	height: auto;\n	float: left;\n}');
});

test('started property', function() {
  return assert.compileTo('body\n	*zoom: 1', 'body {\n	*zoom: 1;\n}');
});

test('!important', function() {
  return assert.compileTo('body\n	width: auto !important', 'body {\n	width: auto !important;\n}');
});

suite('ruleset');

test('remove empty ruleset', function() {
  return assert.compileTo('body\n	$width = 980px', '');
});

suite('assignment');

test('variable is case-insensitive', function() {
  return assert.compileTo('$width = 960px\n$Width = 480px\nbody\n	width: $width', 'body {\n	width: 480px;\n}');
});

test('?= after =', function() {
  return assert.compileTo('$width = 960px\n$width ?= 480px\nbody\n	width: $width', 'body {\n	width: 960px;\n}');
});

test('lone ?= ', function() {
  return assert.compileTo('$width ?= 480px\nbody\n	width: $width', 'body {\n	width: 480px;\n}');
});

suite('identifier');

test('starting with a dash', function() {
  return assert.compileTo('body\n	-webkit-box-sizing: border-box', 'body {\n	-webkit-box-sizing: border-box;\n}');
});

test('not allow starting with double-dash', function() {
  return assert.failAt('body\n	--webkit-box-sizing: border-box', 2, 3);
});

test('interpolate identifier', function() {
  return assert.compileTo('$name = star\n.icon-$name\n	float: left', '.icon-star {\n	float: left;\n}');
});

test('interpolate number', function() {
  return assert.compileTo('$num = 12\n.icon-$num\n	float: left', '.icon-12 {\n	float: left;\n}');
});

test('interpolate string', function() {
  return assert.compileTo('$name = \'star\'\n.icon-$name\n	float: left', '.icon-star {\n	float: left;\n}');
});

test('interpolate list', function() {
  return assert.compileTo('$name = star span\n.icon-$name\n	float: left', '.icon-star span {\n	float: left;\n}');
});

test('not allow interpolating mixin', function() {
  return assert.failAt('$name = @mixin\n	body\n		margin: auto\n.icon-$name\n	float: left', 4, 7);
});

test('interpolate multiple variables', function() {
  return assert.compileTo('$size = big\n$name = star\n.icon-$size$name\n	float: left', '.icon-bigstar {\n	float: left;\n}');
});

test('interpolation consists only two variables', function() {
  return assert.compileTo('$prop = border\n$pos = -left\nbody\n	$prop$pos: solid', 'body {\n	border-left: solid;\n}');
});

test('braced interpolation', function() {
  return assert.compileTo('$prop = border\nbody\n	{$prop}: solid', 'body {\n	border: solid;\n}');
});

test('contain dangling dash', function() {
  return assert.compileTo('$prop = border\n$pos = left\nbody\n	{$prop}-$pos: solid', 'body {\n	border-left: solid;\n}');
});

test('start with dangling dash', function() {
  return assert.compileTo('$prefix = moz\n$prop = box-sizing\nbody\n	-{$prefix}-$prop: border-box', 'body {\n	-moz-box-sizing: border-box;\n}');
});

suite('string');

test('single-quoted string with escaped quote', function() {
  return assert.compileTo('a\n	content: \'"a\\\'\'', 'a {\n	content: \'"a\\\'\';\n}');
});

test('empty single-quoted string', function() {
  return assert.compileTo('a\n	content: \'\'', 'a {\n	content: \'\';\n}');
});

test('not interpolating single-quoted string', function() {
  return assert.compileTo('a\n	content: \'a $var\'', 'a {\n	content: \'a $var\';\n}');
});

test('double-quoted string with escaped quote', function() {
  return assert.compileTo('a\n	content: "\'a0\\""', 'a {\n	content: "\'a0\\"";\n}');
});

test('empty double-quoted string', function() {
  return assert.compileTo('a\n	content: ""', 'a {\n	content: "";\n}');
});

test('interpolate identifier', function() {
  return assert.compileTo('$name = guest\na\n	content: "hello $name"', 'a {\n	content: "hello guest";\n}');
});

test('interpolate single-quoted string', function() {
  return assert.compileTo('$name = \'guest\'\na\n	content: "hello $name"', 'a {\n	content: "hello guest";\n}');
});

test('interpolate double-quoted string', function() {
  return assert.compileTo('$name = "guest"\na\n	content: "hello $name"', 'a {\n	content: "hello guest";\n}');
});

test('interpolate list', function() {
  return assert.compileTo('$name = john doe\na\n	content: "hello $name"', 'a {\n	content: "hello john doe";\n}');
});

test('not allow interpolating mixin', function() {
  return assert.failAt('$name = @mixin\n	body\n		margin: auto\na\n	content: "hello $name"', 5, 18);
});

test('contain braced variable', function() {
  return assert.compileTo('$chapter = 4\nfigcaption\n	content: "Figure {$chapter}-12"', 'figcaption {\n	content: "Figure 4-12";\n}');
});

test('escape braced variable', function() {
  return assert.compileTo('figcaption\n	content: "Figure \\{\\$chapter}-12"', 'figcaption {\n	content: "Figure \\{\\$chapter}-12";\n}');
});

test('contain braces but not variable', function() {
  return assert.compileTo('$chapter = 4\nfigcaption\n	content: "Figure {chapter}-12"', 'figcaption {\n	content: "Figure {chapter}-12";\n}');
});

test('escape double quotes', function() {
  return assert.compileTo('$str = \'"\\""\'\na\n	content: "$str"', 'a {\n	content: "\\"\\"\\"";\n}');
});

suite('number');

test('fraction', function() {
  return assert.compileTo('body\n	line-height: 1.24', 'body {\n	line-height: 1.24;\n}');
});

test('fraction without whole number part', function() {
  return assert.compileTo('body\n	line-height: .24', 'body {\n	line-height: 0.24;\n}');
});

suite('percentage');

test('percentage', function() {
  return assert.compileTo('body\n	width: 33.33%', 'body {\n	width: 33.33%;\n}');
});

suite('dimension');

test('time', function() {
  return assert.compileTo('body\n	-webkit-transition-duration: .24s', 'body {\n	-webkit-transition-duration: 0.24s;\n}');
});

suite('url()');

test('url contains protocol', function() {
  return assert.compileTo('a\n	content: url(http://example.com/icon.png?size=small+big)', 'a {\n	content: url(http://example.com/icon.png?size=small+big);\n}');
});

test('url is string', function() {
  return assert.compileTo('a\n	content: url(\'icon.png\')', 'a {\n	content: url(\'icon.png\');\n}');
});

suite('color');

test('3-digit #rgb', function() {
  return assert.compileTo('body\n	color: #000', 'body {\n	color: #000;\n}');
});

test('6-digit #rgb', function() {
  return assert.compileTo('body\n	color: #ff1234', 'body {\n	color: #ff1234;\n}');
});

suite('function');

test('single argument', function() {
  return assert.compileTo('a\n	content: attr(href)', 'a {\n	content: attr(href);\n}');
});

test('multiple arguments', function() {
  return assert.compileTo('a\n	content: counters(item, \'.\')', 'a {\n	content: counters(item, \'.\');\n}');
});

suite('list');

test('space-separated list', function() {
  return assert.compileTo('body\n	margin: 10px 0 30px', 'body {\n	margin: 10px 0 30px;\n}');
});

test('comma-separated list', function() {
  return assert.compileTo('body\n	font-family: font1, font2, font3', 'body {\n	font-family: font1, font2, font3;\n}');
});

test('slash-separated list', function() {
  return assert.compileTo('body\n	font: 14px/1.2', 'body {\n	font: 14px/1.2;\n}');
});

test('mix-separated list', function() {
  return assert.compileTo('body\n	font: normal 12px/1.25 font1, font2', 'body {\n	font: normal 12px/1.25 font1, font2;\n}');
});

suite('addition');

test('number + number', function() {
  return assert.compileTo('body\n	-foo: 1 + 1', 'body {\n	-foo: 2;\n}');
});

test('number + percentage', function() {
  return assert.compileTo('body\n	-foo: 1 + 1%', 'body {\n	-foo: 2%;\n}');
});

test('number + dimension', function() {
  return assert.compileTo('body\n	-foo: 1 + 1px', 'body {\n	-foo: 2px;\n}');
});

test('number + identifier', function() {
  return assert.compileTo('body\n	-foo: 1 + id', 'body {\n	-foo: 1id;\n}');
});

test('number + mixin, not allowed', function() {
  return assert.failAt('$mixin = @mixin\n	body\n		margin: 0\nbody\n	-foo: 1 + $mixin', 5, 8);
});

test('number + string', function() {
  return assert.compileTo('body\n	-foo: 1 + \'str\'', 'body {\n	-foo: \'1str\';\n}');
});

test('percentage + number', function() {
  return assert.compileTo('body\n	-foo: 1% + 1', 'body {\n	-foo: 2%;\n}');
});

test('percentage + percentage', function() {
  return assert.compileTo('body\n	-foo: 1% + 1%', 'body {\n	-foo: 2%;\n}');
});

test('percentage + dimension', function() {
  return assert.compileTo('body\n	-foo: 2% + 1px', 'body {\n	-foo: 3%;\n}');
});

test('percentage + string', function() {
  return assert.compileTo('body\n	-foo: 2% + \'str\'', 'body {\n	-foo: \'2%str\';\n}');
});

test('dimension + number', function() {
  return assert.compileTo('body\n	-foo: 1px + 1', 'body {\n	-foo: 2px;\n}');
});

test('dimension + dimension', function() {
  return assert.compileTo('body\n	-foo: 1px + 1px', 'body {\n	-foo: 2px;\n}');
});

test('dimension + dimension, different units', function() {
  return assert.compileTo('body\n	-foo: 1em + 1px', 'body {\n	-foo: 2em;\n}');
});

test('dimension + identifier', function() {
  return assert.compileTo('body\n	-foo: 1px + id', 'body {\n	-foo: 1pxid;\n}');
});

test('dimension + string', function() {
  return assert.compileTo('body\n	-foo: 1px + \'str\'', 'body {\n	-foo: \'1pxstr\';\n}');
});

test('boolean + identifier', function() {
  return assert.compileTo('body\n	-foo: true + id', 'body {\n	-foo: trueid;\n}');
});

test('boolean + string', function() {
  return assert.compileTo('body\n	-foo: true + \'str\'', 'body {\n	-foo: \'truestr\';\n}');
});

test('identifier + number', function() {
  return assert.compileTo('body\n	-foo: id + 1', 'body {\n	-foo: id1;\n}');
});

test('identifier + identifier', function() {
  return assert.compileTo('body\n	-foo: -webkit + -moz', 'body {\n	-foo: -webkit-moz;\n}');
});

test('identifier + dimension', function() {
  return assert.compileTo('body\n	-foo: id + 1px', 'body {\n	-foo: id1px;\n}');
});

test('identifier + boolean', function() {
  return assert.compileTo('body\n	-foo: id + true', 'body {\n	-foo: idtrue;\n}');
});

test('identifier + str', function() {
  return assert.compileTo('body\n	-foo: id + \'str\'', 'body {\n	-foo: \'idstr\';\n}');
});

test('string + number', function() {
  return assert.compileTo('body\n	-foo: \'str\' + 1', 'body {\n	-foo: \'str1\';\n}');
});

test('string + percentage', function() {
  return assert.compileTo('body\n	-foo: \'str\' + 1%', 'body {\n	-foo: \'str1%\';\n}');
});

test('string + dimension', function() {
  return assert.compileTo('body\n	-foo: \'str\' + 1px', 'body {\n	-foo: \'str1px\';\n}');
});

test('string + boolean', function() {
  return assert.compileTo('body\n	-foo: \'str\' + false', 'body {\n	-foo: \'strfalse\';\n}');
});

test('string + identifier', function() {
  return assert.compileTo('body\n	-foo: \'str\' + id', 'body {\n	-foo: \'strid\';\n}');
});

test('string + string', function() {
  return assert.compileTo('body\n	-foo: \'foo\' + \'bar\'', 'body {\n	-foo: \'foobar\';\n}');
});

test('string + string, different quotes', function() {
  return assert.compileTo('body\n	-foo: "foo" + \'bar\'', 'body {\n	-foo: "foobar";\n}');
});

test('number+number', function() {
  return assert.compileTo('body\n	-foo: 1+1', 'body {\n	-foo: 2;\n}');
});

test('number+ number', function() {
  return assert.compileTo('body\n	-foo: 1+ 1', 'body {\n	-foo: 2;\n}');
});

suite('subtraction');

test('number - number', function() {
  return assert.compileTo('body\n	-foo: 1 - 1', 'body {\n	-foo: 0;\n}');
});

test('number - percentage', function() {
  return assert.compileTo('body\n	-foo: 1 - 1%', 'body {\n	-foo: 0%;\n}');
});

test('number - dimension', function() {
  return assert.compileTo('body\n	-foo: 1 - 2px', 'body {\n	-foo: -1px;\n}');
});

test('percentage - number', function() {
  return assert.compileTo('body\n	-foo: 1% - 2', 'body {\n	-foo: -1%;\n}');
});

test('percentage - percentage', function() {
  return assert.compileTo('body\n	-foo: 1% - 1%', 'body {\n	-foo: 0%;\n}');
});

test('percentage - dimension', function() {
  return assert.compileTo('body\n	-foo: 1% - 2px', 'body {\n	-foo: -1%;\n}');
});

test('dimension - number', function() {
  return assert.compileTo('body\n	-foo: 1px - 1', 'body {\n	-foo: 0px;\n}');
});

test('dimension - dimension', function() {
  return assert.compileTo('body\n	-foo: 1px - 1px', 'body {\n	-foo: 0px;\n}');
});

test('dimension - dimension, different units', function() {
  return assert.compileTo('body\n	-foo: 1em - 2px', 'body {\n	-foo: -1em;\n}');
});

test('number-number', function() {
  return assert.compileTo('body\n	-foo: 1-1', 'body {\n	-foo: 0;\n}');
});

test('number- number', function() {
  return assert.compileTo('body\n	-foo: 1- 1', 'body {\n	-foo: 0;\n}');
});

suite('multiplication');

test('number * number', function() {
  return assert.compileTo('body\n	-foo: 1 * 2', 'body {\n	-foo: 2;\n}');
});

test('number * percentage', function() {
  return assert.compileTo('body\n	-foo: 2 * 1%', 'body {\n	-foo: 2%;\n}');
});

test('number * dimension', function() {
  return assert.compileTo('body\n	-foo: 1 * 2px', 'body {\n	-foo: 2px;\n}');
});

test('percentage * number', function() {
  return assert.compileTo('body\n	-foo: 1% * 2', 'body {\n	-foo: 2%;\n}');
});

test('percentage * percentage', function() {
  return assert.compileTo('body\n	-foo: 1% * 1%', 'body {\n	-foo: 1%;\n}');
});

test('percentage * dimension', function() {
  return assert.compileTo('body\n	-foo: 1% * 2px', 'body {\n	-foo: 2%;\n}');
});

test('dimension * number', function() {
  return assert.compileTo('body\n	-foo: 1px * 1', 'body {\n	-foo: 1px;\n}');
});

test('dimension * dimension', function() {
  return assert.compileTo('body\n	-foo: 1px * 1px', 'body {\n	-foo: 1px;\n}');
});

test('dimension * dimension, different units', function() {
  return assert.compileTo('body\n	-foo: 1em * 2px', 'body {\n	-foo: 2em;\n}');
});

test('number*number', function() {
  return assert.compileTo('body\n	-foo: 1*2', 'body {\n	-foo: 2;\n}');
});

test('number* number', function() {
  return assert.compileTo('body\n	-foo: 1* 2', 'body {\n	-foo: 2;\n}');
});

test('number *number', function() {
  return assert.compileTo('body\n	-foo: 1 *2', 'body {\n	-foo: 2;\n}');
});

suite('division');

test('number / number', function() {
  return assert.compileTo('body\n	-foo: 1 / 2', 'body {\n	-foo: 0.5;\n}');
});

test('number / 0, not allowed', function() {
  return assert.failAt('body\n	-foo: 1 / 0', 2, 12);
});

test('number / number, result in fraction', function() {
  return assert.compileTo('body\n	-foo: 1 / 3', 'body {\n	-foo: 0.333;\n}');
});

test('number / percentage', function() {
  return assert.compileTo('body\n	-foo: 2 / 1%', 'body {\n	-foo: 2%;\n}');
});

test('number / 0%, not allowed', function() {
  return assert.failAt('body\n	-foo: 1 / 0%', 2, 12);
});

test('number / dimension', function() {
  return assert.compileTo('body\n	-foo: 1 / 2px', 'body {\n	-foo: 0.5px;\n}');
});

test('number / 0px, not allowed', function() {
  return assert.failAt('body\n	-foo: 1 / 0px', 2, 12);
});

test('percentage / number', function() {
  return assert.compileTo('body\n	-foo: 1% / 2', 'body {\n	-foo: 0.5%;\n}');
});

test('percentage / 0, not allowed', function() {
  return assert.failAt('body\n	-foo: 1% / 0', 2, 13);
});

test('percentage / percentage', function() {
  return assert.compileTo('body\n	-foo: 1% / 1%', 'body {\n	-foo: 1%;\n}');
});

test('percentage / 0%, not allowed', function() {
  return assert.failAt('body\n	-foo: 1% / 0%', 2, 13);
});

test('percentage / dimension', function() {
  return assert.compileTo('body\n	-foo: 1% / 2px', 'body {\n	-foo: 0.5%;\n}');
});

test('percentage / 0px, not allowed', function() {
  return assert.failAt('body\n	-foo: 1% / 0px', 2, 13);
});

test('dimension / number', function() {
  return assert.compileTo('body\n	-foo: 1px / 1', 'body {\n	-foo: 1px;\n}');
});

test('dimension / 0, not allowed', function() {
  return assert.failAt('body\n	-foo: 1px / 0', 2, 14);
});

test('dimension / percentage', function() {
  return assert.compileTo('body\n	-foo: 1px / 2%', 'body {\n	-foo: 0.5px;\n}');
});

test('dimension / 0%, not allowed', function() {
  return assert.failAt('body\n	-foo: 1px / 0%', 2, 14);
});

test('dimension / dimension', function() {
  return assert.compileTo('body\n	-foo: 1px / 1px', 'body {\n	-foo: 1px;\n}');
});

test('dimension / dimension, different units', function() {
  return assert.compileTo('body\n	-foo: 1em / 2px', 'body {\n	-foo: 0.5em;\n}');
});

test('dimension / 0px, not allowed', function() {
  return assert.failAt('body\n	-foo: 1px / 0px', 2, 14);
});

test('number/ number', function() {
  return assert.compileTo('body\n	-foo: 1/ 2', 'body {\n	-foo: 0.5;\n}');
});

test('number /number', function() {
  return assert.compileTo('body\n	-foo: 1 /2', 'body {\n	-foo: 0.5;\n}');
});

suite('relational');

test('number < number', function() {
  return assert.compileTo('body\n	-foo: 1 < 2', 'body {\n	-foo: true;\n}');
});

test('number <= number', function() {
  return assert.compileTo('body\n	-foo: 2 <= 2', 'body {\n	-foo: true;\n}');
});

test('number > number', function() {
  return assert.compileTo('body\n	-foo: 2 > 2', 'body {\n	-foo: false;\n}');
});

test('number >= number', function() {
  return assert.compileTo('body\n	-foo: 2 >= 3', 'body {\n	-foo: false;\n}');
});

test('number >= identifer', function() {
  return assert.compileTo('body\n	-foo: 2 >= abc', 'body {\n	-foo: false;\n}');
});

test('identifer < number', function() {
  return assert.compileTo('body\n	-foo: abc < 2', 'body {\n	-foo: false;\n}');
});

test('identifier < identifier', function() {
  return assert.compileTo('body\n	-foo: a < b', 'body {\n	-foo: true;\n}');
});

test('string > string', function() {
  return assert.compileTo('body\n	-foo: \'b\' > \'a\'', 'body {\n	-foo: true;\n}');
});

suite('equality');

test('is, true', function() {
  return assert.compileTo('body\n	-foo: 1 is 1', 'body {\n	-foo: true;\n}');
});

test('is, false', function() {
  return assert.compileTo('body\n	-foo: 1 is 2', 'body {\n	-foo: false;\n}');
});

test('isnt, true', function() {
  return assert.compileTo('body\n	-foo: 1 isnt 2', 'body {\n	-foo: true;\n}');
});

test('isnt, false', function() {
  return assert.compileTo('body\n	-foo: 1 isnt 1', 'body {\n	-foo: false;\n}');
});

suite('logical');

test('true and false', function() {
  return assert.compileTo('body\n	-foo: true and false', 'body {\n	-foo: false;\n}');
});

test('true and true', function() {
  return assert.compileTo('body\n	-foo: true and true', 'body {\n	-foo: true;\n}');
});

test('false and true', function() {
  return assert.compileTo('body\n	-foo: false and true', 'body {\n	-foo: false;\n}');
});

test('false and false', function() {
  return assert.compileTo('body\n	-foo: false and false', 'body {\n	-foo: false;\n}');
});

test('true or false', function() {
  return assert.compileTo('body\n	-foo: true or false', 'body {\n	-foo: true;\n}');
});

test('true or true', function() {
  return assert.compileTo('body\n	-foo: true or true', 'body {\n	-foo: true;\n}');
});

test('false or true', function() {
  return assert.compileTo('body\n	-foo: false or true', 'body {\n	-foo: true;\n}');
});

test('false or false', function() {
  return assert.compileTo('body\n	-foo: false or false', 'body {\n	-foo: false;\n}');
});

test('true and false or true', function() {
  return assert.compileTo('body\n	-foo: true and false or true', 'body {\n	-foo: true;\n}');
});

suite('range');

test('natural range', function() {
  return assert.compileTo('body\n	-foo: 1..3', 'body {\n	-foo: 1 2 3;\n}');
});

test('natural exclusive range', function() {
  return assert.compileTo('body\n	-foo: 1...3', 'body {\n	-foo: 1 2;\n}');
});

test('reversed range', function() {
  return assert.compileTo('body\n	-foo: 3..1', 'body {\n	-foo: 3 2 1;\n}');
});

test('reversed exclusive range', function() {
  return assert.compileTo('body\n	-foo: 3...1', 'body {\n	-foo: 3 2;\n}');
});

test('one number range', function() {
  return assert.compileTo('body\n	-foo: 1..1', 'body {\n	-foo: 1;\n}');
});

test('empty range', function() {
  return assert.compileTo('body\n	-foo: 1...1', 'body {\n	-foo: null;\n}');
});

test('percentage range', function() {
  return assert.compileTo('body\n	-foo: 0%..2%', 'body {\n	-foo: 0% 1% 2%;\n}');
});

test('dimension range', function() {
  return assert.compileTo('body\n	-foo: 100px..102px', 'body {\n	-foo: 100px 101px 102px;\n}');
});

test('mixed range', function() {
  return assert.compileTo('body\n	-foo: 1px..3%', 'body {\n	-foo: 1px 2px 3px;\n}');
});

test('start number must be numberic', function() {
  return assert.failAt('body\n	-foo: a...3', 2, 8);
});

test('end number must be numberic', function() {
  return assert.failAt('body\n	-foo: 1..b', 2, 11);
});

suite('unary');

test('+number', function() {
  return assert.compileTo('body\n	-foo: +1', 'body {\n	-foo: 1;\n}');
});

test('+percentage', function() {
  return assert.compileTo('body\n	-foo: +1%', 'body {\n	-foo: 1%;\n}');
});

test('+dimension', function() {
  return assert.compileTo('body\n	-foo: +1px', 'body {\n	-foo: 1px;\n}');
});

test('+string, not allowed', function() {
  return assert.failAt('body\n	-foo: +\'a\'', 2, 8);
});

test('-number', function() {
  return assert.compileTo('body\n	-foo: -1', 'body {\n	-foo: -1;\n}');
});

test('-percentage', function() {
  return assert.compileTo('body\n	-foo: -1%', 'body {\n	-foo: -1%;\n}');
});

test('-dimension', function() {
  return assert.compileTo('body\n	-foo: -1px', 'body {\n	-foo: -1px;\n}');
});

suite('expression');

test('number + number - number', function() {
  return assert.compileTo('body\n	-foo: 1 + 2 - 1', 'body {\n	-foo: 2;\n}');
});

test('number / number * number', function() {
  return assert.compileTo('body\n	-foo: 1 / 2 * -3', 'body {\n	-foo: -1.5;\n}');
});

test('number + number * number', function() {
  return assert.compileTo('body\n	-foo: 1 + 2 * 3', 'body {\n	-foo: 7;\n}');
});

test('(number + number) * number', function() {
  return assert.compileTo('body\n	-foo: (1 + 2) * 3', 'body {\n	-foo: 9;\n}');
});

test('number > number is boolean', function() {
  return assert.compileTo('body\n	-foo: -1 > 1 is false', 'body {\n	-foo: true;\n}');
});

test('number + number .. number * number', function() {
  return assert.compileTo('body\n	-foo: 1 + 1 .. 2 * 2', 'body {\n	-foo: 2 3 4;\n}');
});

test('list containing empty range', function() {
  return assert.compileTo('body\n	-foo: 3 1 + 1 ... 1 * 2', 'body {\n	-foo: 3 null;\n}');
});

suite('media query');

test('media type', function() {
  return assert.compileTo('@media print\n	body\n		width: auto', '@media print {\n	body {\n		width: auto;\n	}\n}');
});

test('media type with prefix', function() {
  return assert.compileTo('@media not screen\n	body\n		width: auto', '@media not screen {\n	body {\n		width: auto;\n	}\n}');
});

test('media feature', function() {
  return assert.compileTo('@media (max-width: 980px)\n	body\n		width: auto', '@media (max-width: 980px) {\n	body {\n		width: auto;\n	}\n}');
});

test('media feature without value', function() {
  return assert.compileTo('@media (color)\n	body\n		width: auto', '@media (color) {\n	body {\n		width: auto;\n	}\n}');
});

test('media query', function() {
  return assert.compileTo('@media only screen and (color)\n	body\n		width: auto', '@media only screen and (color) {\n	body {\n		width: auto;\n	}\n}');
});

test('nest media query under media query', function() {
  return assert.compileTo('@media screen\n	@media (color)\n		body\n			width: auto', '@media screen and (color) {\n	body {\n		width: auto;\n	}\n}');
});

test('nest media query list under media query', function() {
  return assert.compileTo('@media screen\n	@media (max-width: 980px), (max-width: 560px)\n		body\n			width: auto', '@media\nscreen and (max-width: 980px),\nscreen and (max-width: 560px) {\n	body {\n		width: auto;\n	}\n}');
});

test('nest media query under media query list', function() {
  return assert.compileTo('@media screen, print\n	@media (max-width: 980px)\n		body\n			width: auto', '@media\nscreen and (max-width: 980px),\nprint and (max-width: 980px) {\n	body {\n		width: auto;\n	}\n}');
});

test('nest media query list under media query list', function() {
  return assert.compileTo('@media screen, print\n	@media (max-width: 980px), (max-width: 560px)\n		body\n			width: auto', '@media\nscreen and (max-width: 980px),\nscreen and (max-width: 560px),\nprint and (max-width: 980px),\nprint and (max-width: 560px) {\n	body {\n		width: auto;\n	}\n}');
});

test('deeply nest media query', function() {
  return assert.compileTo('@media screen\n	body\n		width: auto\n		@media (color)\n			@media (monochrome)\n				height: auto\n\n		div\n			height: auto\n\n	@media (monochrome)\n		p\n			margin: 0', '@media screen {\n	body {\n		width: auto;\n	}\n		body div {\n			height: auto;\n		}\n}\n	@media screen and (color) and (monochrome) {\n		body {\n			height: auto;\n		}\n	}\n	@media screen and (monochrome) {\n		p {\n			margin: 0;\n		}\n	}');
});

test('interpolating media query', function() {
  return assert.compileTo('$qry = \'not  screen\'\n@media $qry\n	body\n		width: auto', '@media not screen {\n	body {\n		width: auto;\n	}\n}');
});

test('interpolating media query into media query', function() {
  return assert.compileTo('$qry = \'( max-width: 980px )\'\n@media screen and $qry\n	body\n		width: auto', '@media screen and (max-width: 980px) {\n	body {\n		width: auto;\n	}\n}');
});

test('interpolating media query into media query list', function() {
  return assert.compileTo('$qry1 = \' only screen  and (max-width: 980px) \'\n$qry2 = \'(max-width: 560px)\'\n@media $qry1, $qry2\n	body\n		width: auto', '@media\nonly screen and (max-width: 980px),\n(max-width: 560px) {\n	body {\n		width: auto;\n	}\n}');
});

test('interpolating identifier', function() {
  return assert.compileTo('$qry = screen\n@media $qry\n	body\n		width: auto', '@media screen {\n	body {\n		width: auto;\n	}\n}');
});

test('not allow interpolating invalid media query', function() {
  return assert.failAt('$qry = \'screen @\'\n@media $qry\n	body\n		width: auto', 2, 8);
});

test('allow nesting media type', function() {
  return assert.compileTo('@media screen\n	@media not print\n		body\n			width: auto', '@media screen and not print {\n	body {\n		width: auto;\n	}\n}');
});

suite('@media');

test('not allow containing properties at root level', function() {
  return assert.failAt('@media screen\n	width: auto', 1, 1);
});

test('nest inside ruleset', function() {
  return assert.compileTo('body\n	@media screen\n		width: auto', '@media screen {\n	body {\n		width: auto;\n	}\n}');
});

test('remove empty @media', function() {
  return assert.compileTo('@media screen\n	body\n		$width = 980px', '');
});

suite('@import');

test('import with string', function() {
  return assert.compileTo({
    'base.roo': 'body\n	margin: 0'
  }, '@import \'base\'', 'body {\n	margin: 0;\n}');
});

test('import with url()', function() {
  return assert.compileTo('@import url(base)', '@import url(base);');
});

test('import with url starting with protocol', function() {
  return assert.compileTo('@import \'http://example.com/style\'', '@import \'http://example.com/style\';');
});

test('import with url end with .css', function() {
  return assert.compileTo('@import \'style.css\'', '@import \'style.css\';');
});

test('import with media query', function() {
  return assert.compileTo('@import \'base\' screen', '@import \'base\' screen;');
});

test('nest under ruleset', function() {
  return assert.compileTo({
    'base.roo': 'body\n	margin: 0'
  }, 'html\n	@import \'base\'', 'html body {\n	margin: 0;\n}');
});

test('recursively import', function() {
  return assert.compileTo({
    'reset.roo': 'body\n	margin: 0',
    'button.roo': '@import \'reset\'\n\n.button\n	display: inline-block'
  }, '@import \'button\'', 'body {\n	margin: 0;\n}\n\n.button {\n	display: inline-block;\n}');
});

test('import same file multiple times', function() {
  return assert.compileTo({
    'reset.roo': 'body\n	margin: 0',
    'button.roo': '@import \'reset\'\n\n.button\n	display: inline-block',
    'tabs.roo': '@import \'reset\'\n\n.tabs\n	overflow: hidden'
  }, '@import \'button\'\n@import \'tabs\'', 'body {\n	margin: 0;\n}\n\n.button {\n	display: inline-block;\n}\n\n.tabs {\n	overflow: hidden;\n}');
});

test('recursively import files of the same directory', function() {
  return assert.compileTo({
    'tabs/tab.roo': '.tab\n	float: left',
    'tabs/tabs.roo': '@import \'tab\'\n\n.tabs\n	overflow: hidden'
  }, '@import \'tabs/tabs\'', '.tab {\n	float: left;\n}\n\n.tabs {\n	overflow: hidden;\n}');
});

test('recursively import files of different directories', function() {
  return assert.compileTo({
    'reset.roo': 'body\n	margin: 0',
    'tabs/index.roo': '@import \'../reset\'\n\n.tabs\n	overflow: hidden'
  }, '@import \'tabs/index\'', 'body {\n	margin: 0;\n}\n\n.tabs {\n	overflow: hidden;\n}');
});

test('import empty file', function() {
  return assert.compileTo({
    'var.roo': '$width = 980px'
  }, '@import \'var\'\n\nbody\n	width: $width', 'body {\n	width: 980px;\n}');
});

test('not importing file with variables in the path', function() {
  return assert.compileTo('$path = \'tabs\'\n@import $path', '@import \'tabs\';');
});

test('not allow importing file has syntax error', function() {
  return assert.failAt({
    'base.roo': 'body @\n	margin: 0'
  }, '@import \'base\'', 1, 6, 'base.roo');
});

suite('@extend');

test('extend selector', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n#submit\n	@extend .button', '.button,\n#submit {\n	display: inline-block;\n}');
});

test('ignore following selectors', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n#submit\n	@extend .button\n\n.button\n	display: block', '.button,\n#submit {\n	display: inline-block;\n}\n\n.button {\n	display: block;\n}');
});

test('extend selector containing nested selector', function() {
  return assert.compileTo('.button\n	.icon\n			display:block\n\n#submit\n	@extend .button', '.button .icon,\n#submit .icon {\n	display: block;\n}');
});

test('extend selector containing deeply nested selector', function() {
  return assert.compileTo('.button\n	.icon\n		img\n			display:block\n\n#submit\n	@extend .button', '.button .icon img,\n#submit .icon img {\n	display: block;\n}');
});

test('extend compound selector', function() {
  return assert.compileTo('.button\n	& .icon\n		float: left\n\n#submit .icon\n	@extend .button .icon', '.button .icon,\n#submit .icon {\n	float: left;\n}');
});

test('extend selector containing nested & selector', function() {
  return assert.compileTo('.button\n	& .icon\n		float: left\n\n#submit\n	@extend .button', '.button .icon,\n#submit .icon {\n	float: left;\n}');
});

test('extend selector with selector list', function() {
  return assert.compileTo('.button .icon\n	float: left\n\n#submit .icon, #reset .icon\n	@extend .button .icon', '.button .icon,\n#submit .icon,\n#reset .icon {\n	float: left;\n}');
});

test('deeply extend selector', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n.large-button\n	@extend .button\n	display: block\n\n#submit\n	@extend .large-button', '.button,\n.large-button,\n#submit {\n	display: inline-block;\n}\n\n.large-button,\n#submit {\n	display: block;\n}');
});

test('extend selector under the same ruleset', function() {
  return assert.compileTo('.button\n	.icon\n		float: left\n\n	.large-icon\n		@extend .button .icon', '.button .icon,\n.button .large-icon {\n	float: left;\n}');
});

test('extend self', function() {
  return assert.compileTo('.button\n	.icon\n		float: left\n\n	.icon\n		@extend .button .icon\n		display: block', '.button .icon,\n.button .icon {\n	float: left;\n}\n\n.button .icon,\n.button .icon {\n	display: block;\n}');
});

test('extend by multiple selectors', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n#submit\n	@extend .button\n\n#reset\n	@extend .button', '.button,\n#submit,\n#reset {\n	display: inline-block;\n}');
});

test('extend selector containing selector by multiple selectors', function() {
  return assert.compileTo('.button\n	.icon\n		float: left\n\n\n#submit\n	@extend .button\n\n#reset\n	@extend .button', '.button .icon,\n#submit .icon,\n#reset .icon {\n	float: left;\n}');
});

test('extend selector containg nested @media', function() {
  return assert.compileTo('.button\n	display: inline-block\n	@media screen\n		display: block\n	@media print\n		display: none\n\n#submit\n	@extend .button', '.button,\n#submit {\n	display: inline-block;\n}\n	@media screen {\n		.button,\n		#submit {\n			display: block;\n		}\n	}\n	@media print {\n		.button,\n		#submit {\n			display: none;\n		}\n	}');
});

test('extend selector nested under same @media', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n@media print\n	.button\n		display: block\n\n@media not screen\n	.button\n		display: block\n\n	#submit\n		@extend .button', '.button {\n	display: inline-block;\n}\n\n@media print {\n	.button {\n		display: block;\n	}\n}\n\n@media not screen {\n	.button,\n	#submit {\n		display: block;\n	}\n}');
});

test('extend selector nested under @media with same media query', function() {
  return assert.compileTo('@media screen\n	.button\n		display: inline-block\n\n	@media (color), (monochrome)\n		.button\n			display: block\n\n	@media (color)\n		.button\n			display: inline-block\n\n@media screen and (color)\n	#submit\n		@extend .button', '@media screen {\n	.button {\n		display: inline-block;\n	}\n}\n	@media\n	screen and (color),\n	screen and (monochrome) {\n		.button {\n			display: block;\n		}\n	}\n	@media screen and (color) {\n		.button,\n		#submit {\n			display: inline-block;\n		}\n	}');
});

test('ignore following @media', function() {
  return assert.compileTo('@media screen and (color)\n	.button\n		display: inline-block\n\n@media screen and (color)\n	#submit\n		@extend .button\n\n@media screen and (color)\n	.button\n		display: block', '@media screen and (color) {\n	.button,\n	#submit {\n		display: inline-block;\n	}\n}\n\n@media screen and (color) {\n	.button {\n		display: block;\n	}\n}');
});

test('extend selector in the imported file', function() {
  return assert.compileTo({
    'button.roo': '.button\n	display: inline-block'
  }, '@import \'button\'\n\n#submit\n	@extend .button', '.button,\n#submit {\n	display: inline-block;\n}');
});

test('not extending selector in the importing file', function() {
  return assert.compileTo({
    'button.roo': '#submit\n	@extend .button\n	display: block'
  }, '.button\n	display: inline-block\n\n@import \'button\'', '.button {\n	display: inline-block;\n}\n\n#submit {\n	display: block;\n}');
});

suite('@void');

test('unextended ruleset', function() {
  return assert.compileTo('@void\n	body\n		width: auto', '');
});

test('extended ruleset', function() {
  return assert.compileTo('@void\n	.button\n		display: inline-block\n\n#submit\n	@extend .button', '#submit {\n	display: inline-block;\n}');
});

test('extend ruleset inside @void', function() {
  return assert.compileTo('@void\n	.button\n		display: inline-block\n		.icon\n			float: left\n\n	.large-button\n		@extend .button\n		display: block\n\n#submit\n	@extend .large-button', '#submit {\n	display: inline-block;\n}\n	#submit .icon {\n		float: left;\n	}\n\n#submit {\n	display: block;\n}');
});

test('extend ruleset outside @void has no effect', function() {
  return assert.compileTo('.button\n	display: inline-block\n\n@void\n	.button\n		display: block\n\n	.large-button\n		@extend .button\n\n\n#submit\n	@extend .large-button', '.button {\n	display: inline-block;\n}\n\n#submit {\n	display: block;\n}');
});

test('nest @import under @void', function() {
  return assert.compileTo({
    'button.roo': '.button\n	display: inline-block\n\n.large-button\n	@extend .button\n	width: 100px'
  }, '@void\n	@import \'button\'\n\n#submit\n	@extend .large-button', '#submit {\n	display: inline-block;\n}\n\n#submit {\n	width: 100px;\n}');
});

suite('@if');

test('true condition', function() {
  return assert.compileTo('@if true\n	body\n		width: auto', 'body {\n	width: auto;\n}');
});

test('list as true condition', function() {
  return assert.compileTo('@if \'\', \'\'\n	body\n		width: auto', 'body {\n	width: auto;\n}');
});

test('false condition', function() {
  return assert.compileTo('@if false\n	body\n		width: auto', '');
});

test('0 as false condition', function() {
  return assert.compileTo('@if 0\n	body\n		width: auto', '');
});

test('0% as false condition', function() {
  return assert.compileTo('@if 0%\n	body\n		width: auto', '');
});

test('0px as false condition', function() {
  return assert.compileTo('@if 0px\n	body\n		width: auto', '');
});

test('empty string as false condition', function() {
  return assert.compileTo('@if \'\'\n	body\n		width: auto', '');
});

test('@else if', function() {
  return assert.compileTo('body\n	@if false\n		width: auto\n	@else if true\n		height: auto', 'body {\n	height: auto;\n}');
});

test('short-ciruit @else if', function() {
  return assert.compileTo('body\n	@if false\n		width: auto\n	@else if false\n		height: auto\n	@else if true\n		margin: auto\n	@else if true\n		padding: auto', 'body {\n	margin: auto;\n}');
});

test('@else', function() {
  return assert.compileTo('body\n	@if false\n		width: auto\n	@else\n		height: auto', 'body {\n	height: auto;\n}');
});

test('@else with @else if', function() {
  return assert.compileTo('body\n	@if false\n		width: auto\n	@else if false\n		height: auto\n	@else\n		margin: auto', 'body {\n	margin: auto;\n}');
});

suite('@for');

test('loop natural range', function() {
  return assert.compileTo('@for $i in 1..3\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}\n\n.span-2 {\n	width: 120px;\n}\n\n.span-3 {\n	width: 180px;\n}');
});

test('loop natural exclusive range', function() {
  return assert.compileTo('@for $i in 1...3\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}\n\n.span-2 {\n	width: 120px;\n}');
});

test('loop one number range', function() {
  return assert.compileTo('@for $i in 1..1\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}');
});

test('loop empty range', function() {
  return assert.compileTo('@for $i in 1...1\n	.span-$i\n		width: $i * 60px', '');
});

test('loop reversed range', function() {
  return assert.compileTo('@for $i in 3..1\n	.span-$i\n		width: $i * 60px', '.span-3 {\n	width: 180px;\n}\n\n.span-2 {\n	width: 120px;\n}\n\n.span-1 {\n	width: 60px;\n}');
});

test('loop reversed exclusive range', function() {
  return assert.compileTo('@for $i in 3...1\n	.span-$i\n		width: $i * 60px', '.span-3 {\n	width: 180px;\n}\n\n.span-2 {\n	width: 120px;\n}');
});

test('loop with positive step', function() {
  return assert.compileTo('@for $i by 2 in 1..4\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}\n\n.span-3 {\n	width: 180px;\n}');
});

test('loop with positive step for reversed range', function() {
  return assert.compileTo('@for $i by 2 in 3..1\n	.span-$i\n		width: $i * 60px', '.span-3 {\n	width: 180px;\n}\n\n.span-1 {\n	width: 60px;\n}');
});

test('loop with negative step', function() {
  return assert.compileTo('@for $i by -1 in 1...3\n	.span-$i\n		width: $i * 60px', '.span-2 {\n	width: 120px;\n}\n\n.span-1 {\n	width: 60px;\n}');
});

test('loop with negative step for reversed range', function() {
  return assert.compileTo('@for $i by -2 in 3..1\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}\n\n.span-3 {\n	width: 180px;\n}');
});

test('not allow step number to be zero', function() {
  return assert.failAt('@for $i by 0 in 1..3\n	body\n		width: auto', 1, 12);
});

test('only allow step number to be numberic', function() {
  return assert.failAt('@for $i by a in 1..3\n	body\n		width: auto', 1, 12);
});

test('loop list', function() {
  return assert.compileTo('$icons = foo bar, qux\n@for $icon in $icons\n	.icon-$icon\n		content: "$icon"', '.icon-foo {\n	content: "foo";\n}\n\n.icon-bar {\n	content: "bar";\n}\n\n.icon-qux {\n	content: "qux";\n}');
});

test('loop list with index', function() {
  return assert.compileTo('@for $icon, $i in foo bar, qux\n	.icon-$icon\n		content: "$i $icon"', '.icon-foo {\n	content: "0 foo";\n}\n\n.icon-bar {\n	content: "1 bar";\n}\n\n.icon-qux {\n	content: "2 qux";\n}');
});

test('loop list with index with negative step', function() {
  return assert.compileTo('@for $icon, $i by -1 in foo bar, qux\n	.icon-$icon\n		content: "$i $icon"', '.icon-qux {\n	content: "2 qux";\n}\n\n.icon-bar {\n	content: "1 bar";\n}\n\n.icon-foo {\n	content: "0 foo";\n}');
});

test('loop number', function() {
  return assert.compileTo('@for $i in 1\n	.span-$i\n		width: $i * 60px', '.span-1 {\n	width: 60px;\n}');
});

test('loop null', function() {
  return assert.compileTo('@for $i in null\n	body\n		margin: 0\n\nbody\n	-foo: $i', 'body {\n	-foo: null;\n}');
});

suite('mixin');

test('no params', function() {
  return assert.compileTo('$mixin = @mixin\n	width: auto\n\nbody\n	$mixin()', 'body {\n	width: auto;\n}');
});

test('not allow undefined mixin', function() {
  return assert.failAt('body\n	$mixin()', 2, 2);
});

test('not allow non-mixin to be called', function() {
  return assert.failAt('$mixin = 0\n\nbody\n	$mixin()', 4, 2);
});

test('call mixin multiple times', function() {
  return assert.compileTo('$mixin = @mixin\n	body\n		width: $width\n\n$width = 980px\n$mixin()\n\n$width = 500px\n$mixin()', 'body {\n	width: 980px;\n}\n\nbody {\n	width: 500px;\n}');
});

test('specify parameter', function() {
  return assert.compileTo('$mixin = @mixin $width\n	body\n		width: $width\n\n$mixin(980px)', 'body {\n	width: 980px;\n}');
});

test('specify default parameter', function() {
  return assert.compileTo('$mixin = @mixin $width, $height = 100px\n	body\n		width: $width\n		height: $height\n\n$mixin(980px)', 'body {\n	width: 980px;\n	height: 100px;\n}');
});

test('under-specify arguments', function() {
  return assert.compileTo('$mixin = @mixin $width, $height\n	body\n		width: $width\n		height: $height\n\n$mixin(980px)', 'body {\n	width: 980px;\n	height: null;\n}');
});

test('under-specify arguments for default parameter', function() {
  return assert.compileTo('$mixin = @mixin $width, $height = 300px\n	body\n		width: $width\n		height: $height\n\n$mixin()', 'body {\n	width: null;\n	height: 300px;\n}');
});

suite('scope');

test('ruleset creates new scope', function() {
  return assert.compileTo('$width = 980px\nbody\n	$width = 500px\n	width: $width\nhtml\n	width: $width', 'body {\n	width: 500px;\n}\n\nhtml {\n	width: 980px;\n}');
});

test('@media creates new scope', function() {
  return assert.compileTo('$width = 980px\n\n@media screen\n	$width = 500px\n	body\n		width: $width\n\nhtml\n	width: $width', '@media screen {\n	body {\n		width: 500px;\n	}\n}\n\nhtml {\n	width: 980px;\n}');
});

test('@import does not create new scope', function() {
  return assert.compileTo({
    'base.roo': '$width = 500px\nbody\n	width: $width'
  }, '$width = 980px\n\n@import \'base\'\n\nhtml\n	width: $width', 'body {\n	width: 500px;\n}\n\nhtml {\n	width: 500px;\n}');
});

test('@void creates new scope', function() {
  return assert.compileTo('$width = 100px\n@void\n	$width = 50px\n	.button\n		width: $width\n\n#submit\n	@extend .button\n\n#reset\n	width: $width', '#submit {\n	width: 50px;\n}\n\n#reset {\n	width: 100px;\n}');
});

test('@block creates new scope', function() {
  return assert.compileTo('$width = 980px\n@block\n	$width = 500px\n	body\n		width: $width\nhtml\n	width: $width', 'body {\n	width: 500px;\n}\n\nhtml {\n	width: 980px;\n}');
});

test('@if does not create new scope', function() {
  return assert.compileTo('$width = 980px\n\n@if true\n	$width = 500px\n\nbody\n	width: $width', 'body {\n	width: 500px;\n}');
});

test('@for does not create new scope', function() {
  return assert.compileTo('$width = 980px\n\n@for $i in 1\n	$width = 500px\n\nbody\n	width: $width', 'body {\n	width: 500px;\n}');
});

suite('prefix');

test('box-sizing', function() {
  return assert.compileTo('body\n	box-sizing: border-box', 'body {\n	-webkit-box-sizing: border-box;\n	-moz-box-sizing: border-box;\n	box-sizing: border-box;\n}');
});

test('linear-gradient()', function() {
  return assert.compileTo('body\n	background: linear-gradient(#000, #fff)', 'body {\n	background: -webkit-linear-gradient(#000, #fff);\n	background: -moz-linear-gradient(#000, #fff);\n	background: -o-linear-gradient(#000, #fff);\n	background: linear-gradient(#000, #fff);\n}');
});

test('linear-gradient() with starting position', function() {
  return assert.compileTo('body\n	background: linear-gradient(to bottom, #000, #fff)', 'body {\n	background: -webkit-linear-gradient(top, #000, #fff);\n	background: -moz-linear-gradient(top, #000, #fff);\n	background: -o-linear-gradient(top, #000, #fff);\n	background: linear-gradient(to bottom, #000, #fff);\n}');
});

test('linear-gradient() with starting position consisting of two identifiers', function() {
  return assert.compileTo('body\n	background: linear-gradient(to top left, #000, #fff)', 'body {\n	background: -webkit-linear-gradient(bottom right, #000, #fff);\n	background: -moz-linear-gradient(bottom right, #000, #fff);\n	background: -o-linear-gradient(bottom right, #000, #fff);\n	background: linear-gradient(to top left, #000, #fff);\n}');
});

test('multiple linear-gradient()', function() {
  return assert.compileTo('body\n	background: linear-gradient(#000, #fff), linear-gradient(#111, #eee)', 'body {\n	background: -webkit-linear-gradient(#000, #fff), -webkit-linear-gradient(#111, #eee);\n	background: -moz-linear-gradient(#000, #fff), -moz-linear-gradient(#111, #eee);\n	background: -o-linear-gradient(#000, #fff), -o-linear-gradient(#111, #eee);\n	background: linear-gradient(#000, #fff), linear-gradient(#111, #eee);\n}');
});

test('background with regular value', function() {
  return assert.compileTo('body\n	background: #fff', 'body {\n	background: #fff;\n}');
});

suite('@keyframes');

test('prefixed @keyframes', function() {
  return assert.compileTo('@-webkit-keyframes name\n	0%\n		top: 0\n	100%\n		top: 100px', '@-webkit-keyframes name {\n	0% {\n		top: 0;\n	}\n	100% {\n		top: 100px;\n	}\n}');
});

test('from to', function() {
  return assert.compileTo('@-webkit-keyframes name\n	from\n		top: 0\n	to\n		top: 100px', '@-webkit-keyframes name {\n	from {\n		top: 0;\n	}\n	to {\n		top: 100px;\n	}\n}');
});

test('keyframe selector list', function() {
  return assert.compileTo('@-webkit-keyframes name\n	0%\n		top: 0\n	50%, 60%\n		top: 50px\n	100%\n		top: 100px', '@-webkit-keyframes name {\n	0% {\n		top: 0;\n	}\n	50%, 60% {\n		top: 50px;\n	}\n	100% {\n		top: 100px;\n	}\n}');
});

test('unprefixed @keyframes', function() {
  return assert.compileTo('@keyframes name\n	0%\n		top: 0\n	100%\n		top: 100px', '@-webkit-keyframes name {\n	0% {\n		top: 0;\n	}\n	100% {\n		top: 100px;\n	}\n}\n\n@-moz-keyframes name {\n	0% {\n		top: 0;\n	}\n	100% {\n		top: 100px;\n	}\n}\n\n@-o-keyframes name {\n	0% {\n		top: 0;\n	}\n	100% {\n		top: 100px;\n	}\n}\n\n@keyframes name {\n	0% {\n		top: 0;\n	}\n	100% {\n		top: 100px;\n	}\n}');
});

test('contain property needs to be prefixed', function() {
  return assert.compileTo('@keyframes name\n	from\n		border-radius: 0\n	to\n		border-radius: 10px', '@-webkit-keyframes name {\n	from {\n		-webkit-border-radius: 0;\n		border-radius: 0;\n	}\n	to {\n		-webkit-border-radius: 10px;\n		border-radius: 10px;\n	}\n}\n\n@-moz-keyframes name {\n	from {\n		-moz-border-radius: 0;\n		border-radius: 0;\n	}\n	to {\n		-moz-border-radius: 10px;\n		border-radius: 10px;\n	}\n}\n\n@-o-keyframes name {\n	from {\n		border-radius: 0;\n	}\n	to {\n		border-radius: 10px;\n	}\n}\n\n@keyframes name {\n	from {\n		border-radius: 0;\n	}\n	to {\n		border-radius: 10px;\n	}\n}');
});
