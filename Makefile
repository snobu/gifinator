all:
	make --no-print-directory hint

hint:
	jshint server.js

run:
	node server.js
