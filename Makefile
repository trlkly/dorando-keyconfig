keyconfig.xpi: keyconfig.jar
	rm -f $@.tmp
	zip -r $@.tmp install.js $<
	mv -f $@.tmp $@

keyconfig.jar:
	rm -f $@.tmp
	cd src; zip -r ../$@.tmp *
	mv -f $@.tmp $@

clean: ; -rm -f keyconfig.xpi keyconfig.jar
