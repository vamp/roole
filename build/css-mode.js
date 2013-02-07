CodeMirror.defineMode('css', function(config) {
	function tokenIndent(stream, state) {
		if (stream.match('  '))
			return 'tab'

		stream.eatSpace()
		state.tokenize.pop()
		return null
	}

	function tokenRule(stream, state) {
		var style = tokenBase(stream, state)
		if (stream.match(/^\*?[-\w]*: /, false)) {
			state.tokenize.push(tokenProperty)
			return style
		}

		if (style)
			return style

		state.tokenize.push(tokenSelector)
	}

	function tokenBase(stream, state) {
		if (stream.match(/^'(?:[^'\\]|\\.)*'/))
			return 'string'

		if (stream.match(/^"(?:[^"\\]|\\.)*"/))
			return 'string'

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

		if (stream.match(/^@[-\w]+/))
			return 'at-rule'

		if (stream.match('/*')) {
			state.tokenize.push(tokenComment)
			return 'comment'
		}
	}

	function tokenProperty(stream, state) {
		if (stream.eat(':')) {
			state.tokenize.pop()
			state.tokenize.push(tokenExpression)
			return
		}

		stream.eat('*')
		stream.match(/^[-\w]+/)
		return 'property'
	}

	function tokenExpression(stream, state) {
		var style = tokenBase(stream, state)
		if (!style) {
			var result
			if (stream.match(/^[-+]?(?:\d?\.\d+|\d+)(?:\w+|%)?/)) {
				style = 'value'
			} else if (stream.match(/^\//)) {
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

	function tokenComment(stream, state) {
		if (stream.match(/^.*?\*\//)) {
			state.tokenize.pop()
			return 'comment'
		}

		stream.skipToEnd()
		return 'comment'
	}

	function tokenSelector(stream, state) {
		var style = null
		if (stream.eatWhile(/[-\w#.~+>\[\]=:]/))
			style = 'selector'
		else
			stream.next()

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

	function tokenMediaQuery(stream, state) {
		var style = null
		if (stream.eatWhile(/[-\w()]/)) {
			style = 'selector'
		} else if (stream.eat(':')) {
			state.tokenize.push(tokenExpressionUntilParen)
			style = 'selector'
		} else {
			stream.next()
		}

		if (stream.eol())
			state.tokenize.pop()

		return style
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