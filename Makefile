keyconfig.xpi: chrome/keyconfig.jar
	rm -f $@.tmp
	zip -r $@.tmp install.js install.rdf $<
	mv -f $@.tmp $@

chrome/keyconfig.jar:
	mkdir -p chrome
	rm -f $@.tmp
	cd src; zip -r ../$@.tmp *
	mv -f $@.tmp $@

clean: ; -rm -rf keyconfig.xpi chrome
