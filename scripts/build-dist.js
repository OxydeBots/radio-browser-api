const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  console.log('Preparing dist folder...');
  mkdirp(distRoot);

  // Copy static files/folders
  const toCopy = ['languages', 'README.md', 'package.json', '.env'];
  for(const item of toCopy){
    const src = path.join(projectRoot, item);
    if(fs.existsSync(src)){
      const dest = path.join(distRoot, item);
      copyRecursive(src, dest);
      console.log('Copied', item);
    }
  }

  // Obfuscate all .js files and place in dist preserving structure
  const jsFiles = findJsFiles(projectRoot);
  for(const src of jsFiles){
    const rel = path.relative(projectRoot, src);
    const dest = path.join(distRoot, rel);
    mkdirp(path.dirname(dest));
    console.log('Obfuscating', rel);
    const cmd = `npx javascript-obfuscator "${src}" --output "${dest}" --compact true --self-defending true`;
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log('Build complete. Dist ready at', distRoot);
}catch(err){
  console.error('Build failed:', err.message || err);
  process.exit(1);
}
