all: upload

clean:
	rm -rf build

build/sbh.zip: $(wildcard html/*)
	mkdir -p build
	cd html && zip -9 ../build/sbh.zip *

.PHONY: upload
upload: build/sbh.zip
	butler push build/sbh.zip fluffy/shitty-bullet-hell:html