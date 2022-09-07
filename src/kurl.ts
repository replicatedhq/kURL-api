#!/usr/bin/env node

import * as yargs from "yargs";

yargs
  .commandDir("../commands")
  .env()
  .help()
  .demandCommand()
  .argv;
