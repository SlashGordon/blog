---
title: "Decrypt travis file in github repository"
path: "travis_decrypt"
template: "travis_decrypt.html"
date: 2020-07-12T01:12:34+08:00
lastmod: 2020-07-12T01:12:34+08:00
tags: ["travis", "github", "decrypt"]
categories: ["tutorial"]
---
Travis is a very popular CI service and offers a feature for file encryption to keep your secrets.
At the moment it's not straight forward to decrypt files and therefore I'm going to provide a workaround in this post.
## Workaround send a file with ftp/sftp

In this method we’ll update the .travis.yml in a new branch. There is a file with the name `setup.tar.gz.enc` that we want to decrypt and send via ftp.

```yml
env:
  global:
  - 'SFTP_USER=[user]'
  - 'SFTP_PASSWORD=[password]'
  - 'SFTP_HOST=[base64-encoded-rsa-key]'
before_install:
- openssl aes-256-cbc -K $encrypted_b0276278eb46_key -iv $encrypted_b0276278eb46_iv
  -in setup.tar.gz.enc -out setup.tar.gz -d
- curl --ftp-create-dirs -T setup.tar.gz ${SFTP_HOST} --user ${SFTP_USER}:${SFTP_PASSWORD}
```

Commit the above change to an experimental branch, and trigger a Travis CI.