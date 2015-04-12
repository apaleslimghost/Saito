SRC_FILES = $(wildcard src/*.js)
LIB_FILES = $(patsubst src/%.js, lib/%.js, $(SRC_FILES))
TST_FILES = $(wildcard test/*.js)

all: $(LIB_FILES)

lib/%.js: src/%.js
	@mkdir -p $(@D)
	node_modules/.bin/babel $< > $@

test: all lint $(TST_FILES)
	node_modules/.bin/mocha -u exports

lint: $(SRC_FILES) .jshintrc
	node_modules/.bin/jshint --reporter node_modules/jshint-stylish/stylish.js $(SRC_FILES)

.PHONY: test lint
