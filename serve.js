const esbuild = require('esbuild');
const chokidar = require('chokidar');
const liveserver = require('live-server');

const buildjs = async path => {
  console.log('changed', path);
  let s = Date.now();
  esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,

    minify: false,
    sourcemap: true,

    // Load shaders as text for WebGL.
    loader: {
      '.vs': 'text',
      '.fs': 'text',
      '.eot': 'file',
      '.woff': 'file'
    },

    platform: 'node',
    target: ['node10.4'],
    outfile: 'pub/bundle.js'

  })
  .then(() => {
    let e = Date.now();
    console.log(`No Errors. Build completed (${(e - s) / 1000}s).\n`);
  })
  .catch(() => {
    let e = Date.now();
    console.log(`Errors. Build failed (${(e - s) / 1000}s).\n`);
  });
};

let watcher = chokidar.watch('src/**/*.*', {
  ignored: "src/**/bundle*",
  persistent: true
});

watcher.on('ready', async () => {
  buildjs('all');

  watcher.on('add', buildjs);
  watcher.on('change', buildjs);
});

liveserver.start({
  open: true,
  port: +process.env.PORT || 8080,
  root: "pub"
});
