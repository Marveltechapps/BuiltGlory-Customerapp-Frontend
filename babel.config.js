const fs = require('fs');
const path = require('path');

/** Shell `API_BASE_URL` wins. Otherwise the value is read from this app's `.env` at bundle time. */
function apiBaseFromEnv() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL.trim();
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return '';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() !== 'API_BASE_URL') continue;
    return trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

module.exports = function (api) {
  const apiBase = apiBaseFromEnv();
  api.cache.using(() => apiBase);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      function inlineApiBaseUrl({ types: t }) {
        return {
          name: 'inline-api-base-url',
          visitor: {
            MemberExpression(nodePath) {
              const { node } = nodePath;
              if (
                !t.isMemberExpression(node.object) ||
                node.object.computed ||
                node.computed ||
                !t.isIdentifier(node.object.object, { name: 'process' }) ||
                !t.isIdentifier(node.object.property, { name: 'env' }) ||
                !t.isIdentifier(node.property, { name: 'API_BASE_URL' })
              ) {
                return;
              }
              nodePath.replaceWith(t.stringLiteral(apiBase));
            },
          },
        };
      },
    ],
  };
};
