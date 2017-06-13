const { json, send } = require('micro');

const { generateHash } = require('./auth');

const SURGE = 'surge.sh';
const GITHUB_DELETE_EVENT = 'delete';
const GITHUB_EVENT_HEADER = 'x-github-event';
const GITHUB_SIGNATURE_HEADER = 'x-hub-signature';

module.exports = (sh, domain, secret) => async (req, res) => {
  const event = req.headers[GITHUB_EVENT_HEADER];

  if (!event) {
    return send(res, 400, JSON.stringify('Event header missing'));
  }

  const signature = req.headers[GITHUB_SIGNATURE_HEADER];

  const data = await json(req);

  const hash = generateHash(secret, data);

  if (!signature || signature !== hash) {
    return send(res, 401, JSON.stringify('Invalid Signature'));
  }

  if (event !== GITHUB_DELETE_EVENT) {
    return send(
      res,
      400,
      JSON.stringify(`Event type: "${event}" is not supported`)
    );
  }

  const { ref } = data;
  const url = `${ref}.${domain}.${SURGE}`;

  console.log('Running:');
  console.log(`surge teardown ${url}`);

  const outcome = sh.exec(`node_modules/surge/lib/cli.js teardown ${url}`);

  if (outcome.code != 0) {
    return send(res, 500, JSON.stringify(`Error ${url} has not been deleted`));
  }

  return send(res, 200, JSON.stringify(`Success ${url} has been deleted`));
};
