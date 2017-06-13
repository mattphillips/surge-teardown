const micro = require('micro');

const test = require('ava');
const listen = require('test-listen');
const fetch = require('node-fetch');

const teardown = require('./teardown');

const noop = () => {};
const domain = 'xyz';
const secret = 'abcdef';

const method = 'POST';
const body = JSON.stringify({ ref: 'super_branch' });
const validSha = 'sha1=f9999ecd280492df89b1ee2fe079838a65a68977';

test('should return error response with 400 when github event header is missing', async t => {
  const service = micro(teardown(noop, domain, secret));
  const url = await listen(service);

  const res = await fetch(url);
  const message = await res.json();

  t.is(res.status, 400);
  t.is(message, 'Event header missing');
});

test('should return error response with 401 when github signature header is missing', async t => {
  const service = micro(teardown(noop, domain, secret));
  const url = await listen(service);
  const options = {
    method,
    headers: {
      'x-github-event': 'some event'
    },
    body
  };

  const res = await fetch(url, options);
  const message = await res.json();

  t.is(res.status, 401);
  t.is(message, 'Invalid Signature');
});

test('should return error response with 401 when github signature does not match hash of body', async t => {
  const service = micro(teardown(noop, domain, secret));
  const url = await listen(service);
  const options = {
    method,
    headers: {
      'x-github-event': 'some event',
      'x-hub-signature': 'sha1=invalid'
    },
    body
  };

  const res = await fetch(url, options);
  const message = await res.json();

  t.is(res.status, 401);
  t.is(message, 'Invalid Signature');
});

test('should return error response with 400 when event type is not delete', async t => {
  const service = micro(teardown(noop, domain, secret));
  const url = await listen(service);
  const options = {
    method,
    headers: {
      'x-github-event': 'some event',
      'x-hub-signature': validSha
    },
    body
  };

  const res = await fetch(url, options);
  const message = await res.json();

  t.is(res.status, 400);
  t.is(message, 'Event type: "some event" is not supported');
});

test('should return internal server error when shell script fails', async t => {
  const shellSpy = {
    exec: command => {
      t.is(
        command,
        'node_modules/surge/lib/cli.js teardown super_branch.xyz.surge.sh'
      );
      return {
        code: 127
      };
    }
  };

  const service = micro(teardown(shellSpy, domain, secret));
  const url = await listen(service);
  const options = {
    method,
    headers: {
      'x-github-event': 'delete',
      'x-hub-signature': validSha
    },
    body
  };

  const res = await fetch(url, options);
  const message = await res.json();

  t.is(res.status, 500);
  t.is(message, 'Error super_branch.xyz.surge.sh has not been deleted');
});

test('should return success response when deployment is torn down', async t => {
  const shellSpy = { exec: () => ({ code: 0 }) };
  const service = micro(teardown(shellSpy, domain, secret));
  const url = await listen(service);
  const options = {
    method,
    headers: {
      'x-github-event': 'delete',
      'x-hub-signature': validSha
    },
    body
  };

  const res = await fetch(url, options);
  const message = await res.json();

  t.is(res.status, 200);
  t.is(message, 'Success super_branch.xyz.surge.sh has been deleted');
});
