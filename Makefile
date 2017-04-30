all:
	make --no-print-directory hint

hint:
	node_modules/jshint/bin/jshint server.js

run:
	node server.js
