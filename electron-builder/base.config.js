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
    deleteAppDataOnUninstall: true,

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
    target: 'msi',
    executableName: 'Buffed OBS',
    extraFiles: ['LICENSE', 'AGREEMENT', 'shared-resources/**/*', '!shared-resources/README'],
    rfc3161TimeStampServer: 'http://timestamp.acs.microsoft.com',
    timeStampServer: 'http://timestamp.acs.microsoft.com',
    signDlls: true,
    async sign(config) {
      if (process.env.SLOBS_NO_SIGN) return;

      if (
        config.path.indexOf('node_modules\\obs-studio-node\\data\\obs-plugins\\win-capture') !== -1
      ) {
        console.log(`Skipping ${config.path}`);
        return;
      }

      console.log(`Signing [${config.hash} ${config.path}]`);

      //return;

      const command = `/c/Users/michal/Desktop/signtool-x64/signtool.exe sign -v -debug -fd SHA256 -tr "http://timestamp.acs.microsoft.com" -td SHA256 -dlib /c/Users/michal/Desktop/trust-x64/Azure.CodeSigning.Dlib.dll -dmdf /c/Users/michal/Desktop/signMetadata.json "${path}"`

      try {
        const out = execSync(command, { stdio: 'inherit' });
        console.log(out);
      } catch (error) {
        console.log('SIGN FAILED: ', error)
        console.error(error);
      }

      // await signtool.sign(config.path, {
      // subject: 'Paweł Niżnik',
      //   rfcTimestamp: 'http://ts.ssl.com',
      //   algorithm: 'sha256',
      //   timestampAlgo: 'sha256',
      //   append: config.isNest,
      //   description: config.name,
      //   url: config.site,
      // });
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
