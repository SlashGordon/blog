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
