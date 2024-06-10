# ezBookkeeping

[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/hocx/ezbookkeeping/blob/master/LICENSE)
[![Latest Build](https://img.shields.io/github/actions/workflow/status/hocx/ezbookkeeping/build-and-publish.yml?branch=main)](https://github.com/hocx/ezbookkeeping/actions)
[![Go Report](https://goreportcard.com/badge/github.com/hocx/ezbookkeeping)](https://goreportcard.com/report/github.com/hocx/ezbookkeeping)
[![GitHub repo size](https://img.shields.io/github/repo-size/hocx/ezbookkeeping)](https://github.com/hocx/ezbookkeeping)
![GitHub Release](https://img.shields.io/github/v/release/hocx/ezbookkeeping)
![Uptime Robot status](https://img.shields.io/uptimerobot/status/m796703781-a378b3be0eb750ec6e8508a9)

## Introduction

ezBookkeeping is a lightweight personal bookkeeping app hosted by yourself. It can be deployed on almost all platforms, including Windows, macOS and Linux on x86, amd64 and ARM architectures. You can even deploy it on an raspberry device. It also supports many different databases, including sqlite and mysql. With docker, you can just deploy it via one command without complicated configuration.

## Features

1. Open source & Self-hosted
2. Lightweight & Fast
3. Easy to install
    - Docker support
    - Multiple database support (SQLite, MySQL, PostgreSQL, etc.)
    - Multiple operation system & hardware support (Windows, macOS, Linux & x86, amd64, ARM)
4. User-friendly interface
    - Both desktop and mobile UI
    - Close to native app experience (for mobile device)
    - Two-level account & two-level category support
    - Plentiful preset categories
    - Geographic location and map support
    - Searching & filtering history records
    - Data statistics
    - Dark theme
5. Multiple currency support & automatically updating exchange rates
6. Multiple timezone support
7. Multi-language support
8. Two-factor authentication
9. Application lock (PIN code / WebAuthn)
10. Data export

## Screenshots

### Desktop Version

[![ezBookkeeping](https://raw.githubusercontent.com/wiki/hocx/ezbookkeeping/img/desktop/en.png)](https://raw.githubusercontent.com/wiki/hocx/ezbookkeeping/img/desktop/en.png)

### Mobile Version

[![ezBookkeeping](https://raw.githubusercontent.com/wiki/hocx/ezbookkeeping/img/mobile/en.png)](https://raw.githubusercontent.com/wiki/hocx/ezbookkeeping/img/mobile/en.png)

## Installation

### Ship with docker

Visit [Docker Hub](https://hub.docker.com/r/hocx/ezbookkeeping) to see all images and tags.

Latest Release:

    $ docker run -p8080:8080 mayswind/ezbookkeeping

Latest Daily Build:

    $ docker run -p8080:8080 mayswind/ezbookkeeping:latest-snapshot

### Install from binary

Latest release: [https://github.com/hocx/ezbookkeeping/releases](https://github.com/hocx/ezbookkeeping/releases)

**Linux / macOS**

    $ ./ezbookkeeping server run

**Windows**

    > .\ezbookkeeping.exe server run

ezBookkeeping will listen at port 8080 as default. Then you can visit `http://{YOUR_HOST_ADDRESS}:8080/` .

### Build from source

Make sure you have [Golang](https://golang.org/), [GCC](http://gcc.gnu.org/), [Node.js](https://nodejs.org/) and [NPM](https://www.npmjs.com/) installed. Then download the source code, and follow these steps:

**Linux / macOS**

    $ ./build.sh package -o ezbookkeeping.tar.gz

All the files will be packaged in `ezbookkeeping.tar.gz`.

**Windows**

    > .\build.bat package -o ezbookkeeping.zip

All the files will be packaged in `ezbookkeeping.zip`.

You can also build docker image, make sure you have [docker](https://www.docker.com/) installed, then follow these steps:

**Linux**

    $ ./build.sh docker

## Documents

1. [English](http://ezbookkeeping.mayswind.net)
1. [简体中文 (Simplified Chinese)](http://ezbookkeeping.mayswind.net/zh_Hans)

## License

[MIT](https://github.com/hocx/ezbookkeeping/blob/master/LICENSE)
