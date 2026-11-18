const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function buildHub() {
  const startTime = Date.now();
  console.log('Compilando aplicación DulceHorno Central Hub...');

  const outputDir = path.resolve(__dirname, '..', 'src', 'hub', 'views');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '..', 'src', 'hub', 'renderer', 'App.jsx')],
    bundle: true,
    outfile: path.join(outputDir, 'bundle.js'),
    minify: false,
    sourcemap: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  const duration = Date.now() - startTime;
  console.log(`Compilación Hub completada exitosamente en ${duration}ms -> src/hub/views/bundle.js`);
}

if (require.main === module) {
  buildHub().catch((err) => {
    console.error('Error durante la compilación del Hub:', err);
    process.exit(1);
  });
}

module.exports = buildHub;
