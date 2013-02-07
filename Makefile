DOC_CSS_FILES = \
	components/normalize-css/normalize.css \
	components/codemirror/lib/codemirror.css

DOC_ROO_FILES = \
	style/var.roo\
	style/font.roo\
	style/nav.roo \
	style/toc.roo \
	style/download-button.roo \
	style/code.roo \
	style/snippet.roo \
	style/editor.roo \
	style/theme.roo \
	style/global.roo

DOC_JS_FILES = \
	components/codemirror/lib/codemirror.js \
	build/css-mode.js \
	build/roole-mode.js \
	script/toc.js \
	script/editor.js

VERSION = $(shell node -e "console.log(require('./roole/package.json').version)")

RELEASE_FILE = dist/roole-$(VERSION).js
RELEASE_MIN_FILE = dist/roole-$(VERSION).min.js

doc: roole release script/script.js style/style.css index.html

release: $(RELEASE_FILE) $(RELEASE_MIN_FILE)

$(RELEASE_FILE): roole/dist/roole.js | dist
	cp -f $< $@

$(RELEASE_MIN_FILE): roole/dist/roole.min.js | dist
	cp -f $< $@

roole:
	git merge -s subtree master -m 'subtree merge master branch into roole folder'

style/style.css: roole/bin/roole $(DOC_CSS_FILES) $(DOC_ROO_FILES)
	cat $(DOC_CSS_FILES) >$@
	roole/bin/roole $(DOC_ROO_FILES) >>$@

script/script.js: $(DOC_JS_FILES)
	awk 'FNR==1{print ""}1' $(DOC_JS_FILES) >$@

roole/dist/roole.js:
	cd roole && $(MAKE) roole

roole/dist/roole.min.js:
	cd roole && $(MAKE) min

index.html: \
	node_modules/.bin/marked \
	index.md build/parse-index \
	roole/build/mustache \
	index.mustache \
	build/css-mode.js \
	build/roole-mode.js

	$< --breaks --lang-prefix '' $(word 2,$^) | $(word 3,$^) | $(word 4,$^) $(word 5,$^) >$@

node_modules/%:
	npm install

components/%: node_modules/.bin/bower
	$< install

dist:
	mkdir $@

clean:
	cd roole && $(MAKE) clean

.PHONY: roole doc release clean