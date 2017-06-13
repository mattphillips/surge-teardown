const crypto = require('crypto');

const generateHash = (secret, data) => {
  const buffer = Buffer.from(JSON.stringify(data), 'utf8');
  const sha = crypto.createHmac('sha1', secret).update(buffer).digest('hex');
  return `sha1=${sha}`;
};

module.exports = {
  generateHash: generateHash
};
