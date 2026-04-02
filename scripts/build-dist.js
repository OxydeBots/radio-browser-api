const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../logger')

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');

function mkdirp(p){ fs.mkdirSync(p, { recursive: true }); }

function copyRecursive(src, dest){
  const stat = fs.statSync(src);
  if(stat.isDirectory()){
    mkdirp(dest);
    for(const entry of fs.readdirSync(src)){
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function findJsFiles(dir, files = []){
  for(const name of fs.readdirSync(dir)){
    const full = path.join(dir, name);
    const rel = path.relative(projectRoot, full);
    if(rel.split(path.sep).includes('node_modules')) continue;
    if(rel.split(path.sep).includes('dist')) continue;
    const stat = fs.statSync(full);
    if(stat.isDirectory()){
      findJsFiles(full, files);
    } else if(name.endsWith('.js')){
      files.push(full);
    }
  }
  return files;
}

try{
  logger.log('Preparing dist folder...', 'Loading');
  mkdirp(distRoot);

  // Copy static files/folders
  const toCopy = ['languages', 'README.md', 'package.json', '.env'];
  for(const item of toCopy){
    const src = path.join(projectRoot, item);
    if(fs.existsSync(src)){
      const dest = path.join(distRoot, item);
      copyRecursive(src, dest);
      logger.log(`Copied ${item}`, 'Loading');
    }
  }

  // Obfuscate all .js files and place in dist preserving structure
  const jsFiles = findJsFiles(projectRoot);
  for(const src of jsFiles){
    const rel = path.relative(projectRoot, src);
    const dest = path.join(distRoot, rel);
    mkdirp(path.dirname(dest));
    logger.log(`Obfuscating ${rel}`, 'Loading');
    const cmd = `npx javascript-obfuscator "${src}" --output "${dest}" --compact true --self-defending true`;
    execSync(cmd, { stdio: 'inherit' });
  }

  logger.log('Build complete. Dist ready at ' + distRoot, 'Logs');
} catch(err){
  logger.log('Build failed:', 'Error');
  process.exit(1);
}
