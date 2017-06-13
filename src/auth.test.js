const test = require('ava');

const { generateHash } = require('./auth');

test('should return generated hash of data and secret', t => {
  const secret = 'abcdef';
  const data = { hello: 'world' };

  t.is(
    generateHash(secret, data),
    'sha1=bfb456b1fab720fdad88c9bf5fe60484aef85593'
  );
});
