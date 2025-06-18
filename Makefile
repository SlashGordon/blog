# Define the Hugo version and Docker image
HUGO_VERSION = 0.72
HUGO_IMAGE = hubci/hugo:$(HUGO_VERSION)
# Docker command to run Hugo
HUGO = docker run -p 1313:1313 --rm -v $(shell pwd):/src -w /src $(HUGO_IMAGE)

# Commit message template
COMMIT_MESSAGE = "rebuilding site $(shell date +%Y-%m-%d)"

run:
	$(HUGO) hugo server -D --bind=0.0.0.0

dev:
	$(HUGO) hugo server -D --bind=0.0.0.0 --disableFastRender

clone:
	rm -rf public
	git clone git@github.com:SlashGordon/slashgordon.github.io.git
	mv slashgordon.github.io.git public

new:
	$(HUGO) new post/$(shell date +%Y-%m-%d)-$(title).md

init:
	git submodule init
	git submodule update
	git submodule foreach git checkout master

deploy:
	echo "\033[0;32mDeploying updates to GitHub...\033[0m"

	# Build the project.
	$(HUGO) hugo -D

	cd ./public && git config user.name "SlashGordon" && git config user.email "slash.gordon.dev@gmail.com" && git add . && git commit -m $(COMMIT_MESSAGE) && git push
	git commit -am "update" && git push

rebuild:
	echo "\033[0;32mRebuilding site with updated content...\033[0m"
	$(HUGO) hugo -D

download-libs:
	BASH_ENV=/Users/c.dieck/.bashrc.amazonq /usr/bin/env -i echo "\033[0;32mDownloading JS libraries locally...\033[0m"
	mkdir -p static/lib/jquery static/lib/slideout static/lib/fancybox static/lib/timeago static/lib/flowchart static/lib/sequence
	curl -s https://code.jquery.com/jquery-3.2.1.min.js -o static/lib/jquery/jquery-3.2.1.min.js
	curl -s https://unpkg.com/slideout@1.0.1/dist/slideout.min.js -o static/lib/slideout/slideout-1.0.1.min.js
	curl -s https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.1.20/dist/jquery.fancybox.min.js -o static/lib/fancybox/jquery.fancybox-3.1.20.min.js
	curl -s https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.1.20/dist/jquery.fancybox.min.css -o static/lib/fancybox/jquery.fancybox-3.1.20.min.css
	curl -s https://cdn.jsdelivr.net/npm/timeago.js@3.0.2/dist/timeago.min.js -o static/lib/timeago/timeago-3.0.2.min.js
	curl -s https://cdn.jsdelivr.net/npm/timeago.js@3.0.2/dist/timeago.locales.min.js -o static/lib/timeago/timeago.locales-3.0.2.min.js
	curl -s https://cdn.jsdelivr.net/npm/raphael@2.2.7/raphael.min.js -o static/lib/flowchart/raphael-2.2.7.min.js
	curl -s https://cdn.jsdelivr.net/npm/flowchart.js@1.8.0/release/flowchart.min.js -o static/lib/flowchart/flowchart-1.8.0.min.js
	curl -s https://cdn.jsdelivr.net/npm/webfontloader@1.6.28/webfontloader.js -o static/lib/sequence/webfontloader-1.6.28.js
	curl -s https://cdn.jsdelivr.net/npm/snapsvg@0.5.1/dist/snap.svg-min.js -o static/lib/sequence/snap.svg-0.5.1.min.js
	curl -s https://cdn.jsdelivr.net/npm/underscore@1.8.3/underscore-min.js -o static/lib/sequence/underscore-1.8.3.min.js
	curl -s https://cdn.jsdelivr.net/gh/bramp/js-sequence-diagrams@2.0.1/dist/sequence-diagram-min.js -o static/lib/sequence/sequence-diagram-2.0.1.min.js
	curl -s https://cdn.jsdelivr.net/gh/bramp/js-sequence-diagrams@2.0.1/dist/sequence-diagram-min.css -o static/lib/sequence/sequence-diagram-2.0.1.min.css