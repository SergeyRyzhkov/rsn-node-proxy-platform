import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

class NpmPublish {

  private paths = {
    src: path.resolve(__dirname, 'src'),
    debug: path.resolve(__dirname, 'debug'),
    dist: path.resolve(__dirname, 'dist'),
    lib: path.resolve(__dirname, 'lib')
  };

  private importSt: string = '';

  public publish () {
    this.cleanUp();
    this.buildIndexTs();
    this.compile();
    this.convertPathAliasToRelative();
    this.publishPackage();
  }

  private cleanUp () {
    this.deleteFolder(this.paths.dist);
    this.deleteFolder(this.paths.debug);
    this.deleteFolder(this.paths.lib);
    this.deleteSrcIndexTs();

    return this;
  }

  private deleteSrcIndexTs () {
    const indexPath = path.resolve(this.paths.src, 'index.ts');
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
    }
  }

  private buildIndexTs () {
    const indexPath = path.resolve(this.paths.src, 'index.ts')
    this.processFolder(this.paths.src, this.buildTsIndexFile.bind(this), this.paths.src)
    fs.writeFileSync(indexPath, this.importSt);
  }

  private compile () {
    try {
      // execSync('tsc --emitDeclarationOnly');
      execSync('tsc');
      // tslint:disable-next-line:no-empty
    } catch (exc) {
    }
  }

  // private copyTs () {
  //   fsExtra.copySync(this.paths.src, this.paths.lib);
  // }

  private convertPathAliasToRelative () {
    this.processFolder(this.paths.lib, this.convertPathAliasToRelativeTypeIndex.bind(this), this.paths.lib);
  }

  private processFolder (folderPath, visitor, startFolderPath) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.resolve(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        this.processFolder(curPath, visitor, startFolderPath);
      } else {
        visitor(startFolderPath, curPath);
      }
    });
  }

  private buildTsIndexFile (folderPath, filePath) {
    if (!filePath.endsWith('index.ts')) {
      const fromImort = filePath.replace(folderPath, '').replace('.ts', '').split(path.sep).join('/');
      this.importSt = this.importSt + `export * from '.${fromImort}'` + '\n';
    }
  }

  private convertPathAliasToRelativeTypeIndex (folderPath, filePath) {
    const contents = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(`${folderPath}${path.sep}`, '');
    const repl = relativePath.split(path.sep).length > 1 ? '../'.repeat(relativePath.split(path.sep).length - 1) : './';
    const newContents = contents.replace(folderPath, '').replace(/@\//g, repl);
    fs.writeFileSync(filePath, newContents, 'utf8');
  }


  private publishPackage () {
    const source = fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8');
    const sourceObj = JSON.parse(source);
    sourceObj.scripts = {};
    sourceObj.devDependencies = {};
    sourceObj.main = 'index.js';

    const versions: string[] = (sourceObj.version as string).split('.');
    versions.splice(versions.length - 1, 1, (parseInt(versions[versions.length - 1], 10) + 1).toString());
    sourceObj.version = versions.join('.');

    fs.writeFileSync(path.resolve(this.paths.lib, 'package.json'), JSON.stringify(sourceObj), 'utf8');

    if (fs.existsSync(path.resolve(__dirname, '.npmignore'))) {
      fs.copyFileSync(path.resolve(__dirname, '.npmignore'), path.resolve(this.paths.lib, '.npmignore'));
    }

    if (fs.existsSync(path.resolve(__dirname, '.npmrc'))) {
      fs.copyFileSync(path.resolve(__dirname, '.npmrc'), path.resolve(this.paths.lib, '.npmrc'));
    }

    if (fs.existsSync(path.resolve(__dirname, 'README.md'))) {
      fs.copyFileSync(path.resolve(__dirname, 'README.md'), path.resolve(this.paths.lib, 'README.md'));
    }

    if (fs.existsSync(path.resolve(__dirname, 'LICENSE'))) {
      fs.copyFileSync(path.resolve(__dirname, 'LICENSE'), path.resolve(this.paths.lib, 'LICENSE'));
    }

    process.chdir(this.paths.lib);
    execSync('npm publish');

    this.deleteFolder(this.paths.lib);
    this.deleteSrcIndexTs();
  }

  private deleteFolder (folderPath: string) {
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, {
        recursive: true
      });
    }
  }

}

new NpmPublish().publish();