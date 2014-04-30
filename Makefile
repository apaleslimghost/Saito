include node_modules/make-livescript/livescript.mk

test: all
	./node_modules/.bin/mocha -r LiveScript -u exports test.ls