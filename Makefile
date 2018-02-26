ZIPFILES=install.rdf chrome.manifest README.md icon.png icon64.png defaults \
         components content locale skin
DEPFILES=$(shell find $(ZIPFILES) -type f -print)

keyconfig.xpi: $(DEPFILES)
	rm -f $@.tmp
	zip -r $@.tmp $(ZIPFILES)
	mv -f $@.tmp $@

clean: ; -rm -rf keyconfig.xpi

