const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function build() {
  const startTime = Date.now();
  console.log('Compilando aplicación React para DulceHorno...');

  const outputDir = path.resolve(__dirname, '..', 'src', 'views');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '..', 'src', 'renderer', 'index.jsx')],
    bundle: true,
    outfile: path.join(outputDir, 'bundle.js'),
    minify: false,
    sourcemap: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.svg': 'text'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  const duration = Date.now() - startTime;
  console.log(`Compilación React completada exitosamente en ${duration}ms -> src/views/bundle.js`);
}

if (require.main === module) {
  build().catch((err) => {
    console.error('Error durante la compilación de React:', err);
    process.exit(1);
  });
}

module.exports = build;

