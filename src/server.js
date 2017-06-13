const shell = require('shelljs');
const teardown = require('./teardown');

const domain = process.env.DOMAIN;
const secret = process.env.GITHUB_SECRET;

module.exports = teardown(shell, domain, secret);
