const signtool = require('signtool');

const base = {
  appId: 'me.buffed.app.desktop',
  productName: 'Buffed Desktop',
  icon: 'media/images/icon.ico',
  files: [
    'bundles',
    '!bundles/*.js.map',
    'node_modules',
    'vendor',
    'app/i18n',
    'media/images/game-capture',
    'updater/build/bootstrap.js',
    'updater/build/bundle-updater.js',
    'updater/index.html',
    'index.html',
    'monitor-helper/index.html',
    'main.js',
    'obs-api',
    'updater/mac/index.html',
    'updater/mac/Updater.js',
  ],
  directories: {
    buildResources: '.',
  },
  nsis: {
    license: 'AGREEMENT',
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    include: 'installer.nsh',
  },
  asarUnpack: [
    '**/node-libuiohook/**',
    '**/node-fontinfo/**',
    '**/font-manager/**',
    '**/game_overlay/**',
    '**/color-picker/**',
  ],
  publish: {
    provider: 'github',
    owner: 'Moriquendi',
    repo: 'desktop',
    // url: 'https://buffed-cdn.buffed.me',
  },
  win: {
    executableName: 'Buffed OBS',
    extraFiles: ['LICENSE', 'AGREEMENT', 'shared-resources/**/*', '!shared-resources/README'],
    rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    timeStampServer: 'http://timestamp.digicert.com',
    signDlls: true,
    async sign(config) {
      console.log('Windows signing disabled for now....');
      return;
      if (process.env.SLOBS_NO_SIGN) return;

      if (
        config.path.indexOf('node_modules\\obs-studio-node\\data\\obs-plugins\\win-capture') !== -1
      ) {
        console.log(`Skipping ${config.path}`);
        return;
      }

      console.log(`Signing [${config.hash} ${config.path}]`);
      await signtool.sign(config.path, {
        subject: 'Streamlabs (General Workings, Inc.)',
        rfcTimestamp: 'http://timestamp.digicert.com',
        algorithm: config.hash,
        append: config.isNest,
        description: config.name,
        url: config.site,
      });
    },
  },
  mac: {
    extraFiles: [
      'shared-resources/**/*',
      '!shared-resources/README',
      // {
      //   "from": "node_modulesdwadawd/obs-studio-node/Frameworks/*",
      //   "to": "Frameworks/",
      //   "filter": ["**/*"]
      // },
      // {
      //   "from": "node_modules/obs-studio-node/Frameworks/*",
      //   "to": "Resources/app.asar.unpacked/node_modules/",
      //   "filter": ["**/*"]
      // }
    ],
    icon: 'media/images/icon-mac.icns',
    hardenedRuntime: true,
    entitlements: 'electron-builder/entitlements.plist',
    entitlementsInherit: 'electron-builder/entitlements.plist',
    extendInfo: {
      CFBundleURLTypes: [
        {
          CFBundleURLName: 'Buffed OBS Link',
          CFBundleURLSchemes: ['me.buffed.app.desktop'],
        },
      ],
    },
  },
  dmg: {
    background: 'media/images/dmg-bg.png',
    iconSize: 85,
    contents: [
      {
        x: 130,
        y: 208,
      },
      {
        type: 'link',
        path: '/Applications',
        x: 380,
        y: 208,
      },
    ],
  },
  extraMetadata: {
    env: 'production',
    sentryFrontendDSN: process.env.SLD_SENTRY_FRONTEND_DSN,
    sentryBackendClientURL: process.env.SLD_SENTRY_BACKEND_CLIENT_URL,
    sentryBackendClientPreviewURL: process.env.SLD_SENTRY_BACKEND_CLIENT_PREVIEW_URL,
  },
  afterPack: './electron-builder/afterPack.js',
  afterSign: './electron-builder/notarize.js',
};

module.exports = base;
