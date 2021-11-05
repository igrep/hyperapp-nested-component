#!/bin/bash

# A dirty workaround to avoid using a bundler.
sed -i \
  -e '/^\(exports\|"use strict"\)/d' \
  -e 's#^var hyperapp_1 = require("hyperapp");$#import * as hyperapp_1 from "./node_modules/hyperapp/index.js";#' \
  index.js
