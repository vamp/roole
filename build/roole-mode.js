CodeMirror.defineMode('roole', function(config) {
	function tokenIndent(stream, state) {
		if (stream.match('  '))
			return 'tab'

		stream.eatSpace()
		state.tokenize.pop()
		return null
	}

	function tokenRule(stream, state) {
		var style = tokenBase(stream, state)
		if (stream.match(/^\*?[-\w{}$]*: /, false)) {
			state.tokenize.push(tokenProperty)
			return style
		}

		if (style)
			return style

		state.tokenize.push(tokenSelector)
	}

	function tokenBase(stream, state) {
		if (stream.match(/^\$-?\w[-\w]*/)) {
			var tokenize = state.tokenize[state.tokenize.length - 1]
			if (tokenize !== tokenSelector) {
				if (stream.match(/^\s*\??=/, false))
					state.tokenize.push(tokenAssignment)
				else if (stream.peek() === '(')
					state.tokenize.push(tokenArguments)
			}
			return 'variable'
		}

		if (stream.match(/^'(?:[^'\\]|\\.)*'/))
			return 'string'

		if (stream.eat('"')) {
			state.tokenize.push(tokenString)
			return 'string'
		}

		if (stream.match(/^@(?:else\s+if|if)/i)) {
			state.tokenize.push(tokenExpression)
			return 'at-rule'
		}

		if (stream.match(/^@for/i)) {
			state.tokenize.push(tokenFor)
			return 'at-rule'
		}

		if (stream.match(/^@media/i)) {
			state.tokenize.push(tokenMediaQuery)
			return 'at-rule'
		}

		if (stream.match(/^@import/i)) {
			state.tokenize.push(tokenImport)
			return 'at-rule'
		}

		if (stream.match(/^@[-\w]*keyframes/i)) {
			state.tokenize.push(tokenExpression)
			return 'at-rule'
		}

		if (stream.match(/^@extend/i)) {
			state.tokenize.push(tokenSelector)
			return 'at-rule'
		}

		if (stream.match(/^@[-\w]+/))
			return 'at-rule'

		if (stream.match('//')) {
			stream.skipToEnd()
			return 'comment'
		}

		if (stream.match('/*')) {
			state.tokenize.push(tokenComment)
			return 'comment'
		}
	}

	function tokenBaseUntilBrace(stream, state) {
		if (stream.eat('}')) {
			state.tokenize.pop()
			return
		}

		var style = tokenBase(stream, state)
		if (!style)
			stream.next()

		return style
	}

	function tokenString(stream, state) {
		if (stream.match(/^(?:[^\\{$"]+|\\.)/))
			return 'string'

		if (stream.peek() === '$') {
			var style = tokenBase(stream, state)
			if (!style) {
				stream.next()
				style = 'string'
			}
			return style
		}

		if (stream.match(/^{\s*\$-?\w[-\w]*\s*}/, false)) {
			stream.next()
			state.tokenize.push(tokenBaseUntilBrace)
			return
		}

		if (stream.eat('"')) {
			state.tokenize.pop()
			if (stream.eol() && state.tokenize[state.tokenize.length - 1] === tokenExpression)
				state.tokenize.pop()
			return 'string'
		}

		stream.next()
		return 'string'
	}

	function tokenComment(stream, state) {
		if (stream.match(/^.*?\*\//)) {
			state.tokenize.pop()
			return 'comment'
		}

		stream.skipToEnd()
		return 'comment'
	}

	function tokenAssignment(stream, state) {
		stream.match(/^\??=/)
		state.tokenize.pop()
		state.tokenize.push(tokenExpression)
		return 'operator'
	}

	function tokenExpression(stream, state) {
		if (stream.column() === stream.indentation()) {
			state.tokenize.pop()
			return
		}

		var style = tokenBase(stream, state)
		if (!style) {
			var result
			if (stream.match(/^[-+]?(?:\d?\.\d+|\d+)(?:\w+|%)?/)) {
				style = 'value'
			} else if (stream.match(/^(?:[-+*\/()]|<=|<|>=|>|and|or|isnt|is)/)) {
				style = 'operator'
			} else if (result = stream.match(/^(-?[a-z_][-\w]*)/i)) {
				if (stream.peek() === '(') {
					if (result[0].toLowerCase() === 'url')
						state.tokenize.push(tokenUrlFunction)
					else
						state.tokenize.push(tokenFunction)
					style = 'function'
				} else {
					style = 'value'
				}
			} else if (stream.match(/^((?:\d?\.\d+|\d+)(?:\w+|%))?\.\.\.?\1/)) {
				style = 'value'
			} else if (stream.match(/^#\w+/)) {
				style = 'value'
			} else {
				stream.next()
			}
		}

		if (stream.eol()) {
			state.tokenize.pop()
			if (state.tokenize[state.tokenize.length - 1] === tokenExpression)
				state.tokenize.pop()
		}

		return style
	}

	function tokenProperty(stream, state) {
		var style = tokenBase(stream, state)
		if (style)
			return style

		if (stream.eat(':')) {
			state.tokenize.pop()
			state.tokenize.push(tokenExpression)
			return
		}

		if (stream.eat(/[{}]/))
			return

		stream.eat('*')
		stream.match(/^[-\w]+/)
		return 'property'
	}

	function tokenSelector(stream, state) {
		var style = tokenBase(stream, state)
		if (!style) {
			if (stream.eat('&'))
				style = 'operator'
			else if (stream.eatWhile(/[-\w#.~+>\[\]=:]/))
				style = 'selector'
			else
				stream.next()
		}

		if (stream.eol())
			state.tokenize.pop()

		return style
	}

	function tokenUrlFunction(stream, state) {
		if (stream.eat('('))
			return

		if (stream.eat(')')) {
			state.tokenize.pop()
			return
		}

		if (stream.eatWhile(/[^)\s]/))
			return 'string'
	}

	function tokenFunction(stream, state) {
		if (stream.eat('('))
			return

		if (stream.eat(')')) {
			state.tokenize.pop()
			return
		}

		if (stream.eat(','))
			return

		return tokenExpression(stream, state)
	}

	function tokenFor(stream, state) {
		if (stream.match(/^by/i)) {
			state.tokenize.push(tokenExpressionUntilIn)
			return 'at-rule'
		}

		if (stream.match(/^in/i)) {
			state.tokenize.pop()
			state.tokenize.push(tokenExpression)
			return 'at-rule'
		}

		var style = tokenBase(stream, state)
		if (!style)
			stream.next()

		return style
	}

	function tokenExpressionUntilIn(stream, state) {
		if (stream.match(/^in/i, false)) {
			state.tokenize.pop()
			return
		}

		return tokenExpression(stream, state)
	}

	function tokenMediaQuery(stream, state) {
		var style = tokenBase(stream, state)
		if (!style) {
			if (stream.eatWhile(/[-\w()]/)) {
				style = 'selector'
			} else if (stream.eat(':')) {
				state.tokenize.push(tokenExpressionUntilParen)
				style = 'selector'
			}
			else {
				stream.next()
			}
		}

		if (stream.eol())
			state.tokenize.pop()

		return style
	}

	function tokenArguments(stream, state) {
		if (stream.eat('(')) {
			state.tokenize.push(tokenExpressionUntilParen)
			return
		}

		if (stream.eat(')')) {
			state.tokenize.pop()
			return
		}
	}

	function tokenExpressionUntilParen(stream, state) {
		if (stream.peek() === ')') {
			state.tokenize.pop()
			return
		}

		return tokenExpression(stream, state)
	}

	function tokenImport(stream, state) {
		if (!state.importExpression) {
			state.importExpression = true
			return tokenExpression(stream, state)
		}

		state.importExpression = false

		state.tokenize.pop()

		if (stream.match(/\S/, false))
			state.tokenize.push(tokenMediaQuery)

		return
	}

	return {
		startState: function() {
			return {tokenize: [tokenRule]}
		},

		token: function(stream, state) {
			var tokenize = state.tokenize[state.tokenize.length - 1]
			if (tokenize !== tokenIndent) {
				if (stream.sol() && stream.peek() === ' ') {
					state.tokenize.push(tokenIndent)
					return
				}

				if (stream.eatSpace()) {
					return null
				}
			}

			return tokenize(stream, state)
		}
	}
})