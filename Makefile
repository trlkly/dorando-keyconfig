keyconfig.xpi: keyconfig.zip
	rm -f $@.tmp
	zip -r $@.tmp install.rdf chrome.manifest defaults components $<
	mv -f $@.tmp $@

keyconfig.zip:
	rm -f $@.tmp
	cd src; zip -r ../$@.tmp *
	mv -f $@.tmp $@

clean: ; -rm -rf keyconfig.xpi keyconfig.zip

