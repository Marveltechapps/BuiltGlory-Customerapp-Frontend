const fs = require('fs');
const path = require('path');

/** Shell `API_BASE_URL` wins. Otherwise the value is read from this app's `.env` at bundle time. */
function apiBaseFromEnv() {
  const fromShell = (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '').trim();
  if (fromShell) return fromShell;
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return '';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== 'API_BASE_URL' && key !== 'EXPO_PUBLIC_API_BASE_URL') continue;
    return trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

function isProcessEnv(node, name) {
  if (!node || node.computed) return false;
  const prop = node.property;
  if (!prop || prop.name !== name) return false;
  const object = node.object;
  if (!object || object.computed) return false;
  return (
    object.object &&
    object.object.type === 'Identifier' &&
    object.object.name === 'process' &&
    object.property &&
    object.property.name === 'env'
  );
}

module.exports = function (api) {
  const apiBase = apiBaseFromEnv();
  api.cache.using(() => apiBase);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      function inlineApiBase({ types: t }) {
        return {
          name: 'inline-api-base-url',
          visitor: {
            'MemberExpression|OptionalMemberExpression'(path) {
              if (isProcessEnv(path.node, 'API_BASE_URL') || isProcessEnv(path.node, 'EXPO_PUBLIC_API_BASE_URL')) {
                path.replaceWith(t.stringLiteral(apiBase));
              }
            },
          },
        };
      },
    ],
  };
};
