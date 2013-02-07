CodeMirror.defineMode("htmlmixed", function(config) {
  var htmlMode = CodeMirror.getMode(config, {name: "xml", htmlMode: true});
  var rooleMode = CodeMirror.getMode(config, "roole");

  function html(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if (/(?:^|\s)tag(?:\s|$)/.test(style) && stream.current() == ">" && state.htmlState.context) {
     if (/^style$/i.test(state.htmlState.context.tagName)) {
        state.token = roole;
        state.localState = rooleMode.startState(htmlMode.indent(state.htmlState, ""));
      }
    }
    return style;
  }
  function maybeBackup(stream, pat, style) {
    var cur = stream.current();
    var close = cur.search(pat), m;
    if (close > -1) stream.backUp(cur.length - close);
    else if (m = cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur[0]);
    }
    return style;
  }

  function roole(stream, state) {
    if (stream.match(/^<\/\s*style\s*>/i, false)) {
      state.token = html;
      state.localState = null;
      return html(stream, state);
    }
    return maybeBackup(stream, /<\/\s*style\s*>/,
                       rooleMode.token(stream, state.localState));
  }

  return {
    startState: function() {
      var state = htmlMode.startState();
      return {token: html, localState: null, mode: "html", htmlState: state};
    },

    copyState: function(state) {
      if (state.localState)
        var local = CodeMirror.copyState(rooleMode, state.localState);
      return {token: state.token, localState: local, mode: state.mode,
              htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
    },

    token: function(stream, state) {
      return state.token(stream, state);
    },

    indent: function(state, textAfter) {
      if (state.token == html || /^\s*<\//.test(textAfter))
        return htmlMode.indent(state.htmlState, textAfter);
      else
        return rooleMode.indent(state.localState, textAfter);
    },

    electricChars: "/{}:",

    innerMode: function(state) {
      var mode = state.token == html ? htmlMode : rooleMode;
      return {state: state.localState || state.htmlState, mode: mode};
    }
  };
}, "xml", "roole");

CodeMirror.defineMIME("text/html", "htmlmixed");
