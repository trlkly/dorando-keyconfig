keyconfig.xpi:
	rm -f $@.tmp
	zip -r $@.tmp install.rdf chrome.manifest README.md icon.png icon64.png defaults components content locale skin
	mv -f $@.tmp $@

clean: ; -rm -rf keyconfig.xpi

