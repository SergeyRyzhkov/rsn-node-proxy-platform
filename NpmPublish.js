"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
class NpmPublish {
    constructor() {
        this.paths = {
            src: path.resolve(__dirname, 'src'),
            debug: path.resolve(__dirname, 'debug'),
            npm: path.resolve(__dirname, 'npm'),
            npm_lib: path.resolve(__dirname, 'npm', 'lib'),
            npm_typings: path.resolve(__dirname, 'npm', 'types')
        };
        this.importSt = '';
    }
    publish() {
        this.cleanUp();
        this.buildIndexTs();
        this.compile();
        this.convertPathAliasToRelative();
        this.publishPackage();
        this.afterPublish();
    }
    cleanUp() {
        this.deleteFolder(this.paths.npm);
        this.deleteSrcIndexTs();
        return this;
    }
    deleteSrcIndexTs() {
        const indexPath = path.resolve(this.paths.src, 'index.ts');
        if (fs.existsSync(indexPath)) {
            fs.unlinkSync(indexPath);
        }
    }
    buildIndexTs() {
        const indexPath = path.resolve(this.paths.src, 'index.ts');
        this.processFolder(this.paths.src, this.buildTsIndexFile.bind(this), this.paths.src);
        fs.writeFileSync(indexPath, this.importSt);
    }
    compile() {
        try {
            child_process_1.execSync('tsc');
        }
        catch (exc) {
        }
    }
    convertPathAliasToRelative() {
        this.processFolder(this.paths.npm_lib, this.convertPathAliasToRelativeIndex.bind(this), this.paths.npm_lib);
        this.processFolder(this.paths.npm_typings, this.convertPathAliasToRelativeIndex.bind(this), this.paths.npm_typings);
    }
    processFolder(folderPath, visitor, startFolderPath) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.resolve(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                this.processFolder(curPath, visitor, startFolderPath);
            }
            else {
                visitor(startFolderPath, curPath);
            }
        });
    }
    buildTsIndexFile(folderPath, filePath) {
        if (!filePath.endsWith('index.ts')) {
            const fromImort = filePath.replace(folderPath, '').replace('.ts', '').split(path.sep).join('/');
            this.importSt = this.importSt + `export * from '.${fromImort}'` + '\n';
        }
    }
    convertPathAliasToRelativeIndex(folderPath, filePath) {
        const contents = fs.readFileSync(filePath, 'utf8');
        const relativePath = filePath.replace(`${folderPath}${path.sep}`, '');
        const repl = relativePath.split(path.sep).length > 1 ? '../'.repeat(relativePath.split(path.sep).length - 1) : './';
        const newContents = contents.replace(folderPath, '').replace(/@\//g, repl);
        fs.writeFileSync(filePath, newContents, 'utf8');
    }
    publishPackage() {
        const source = fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8');
        const sourceObj = JSON.parse(source);
        sourceObj.scripts = {};
        sourceObj.devDependencies = {};
        sourceObj.main = 'lib/index.js';
        sourceObj.files = ['lib', 'types'];
        sourceObj.types = 'types/index.d.ts';
        const versions = sourceObj.version.split('.');
        versions.splice(versions.length - 1, 1, (parseInt(versions[versions.length - 1], 10) + 1).toString());
        sourceObj.version = versions.join('.');
        fs.writeFileSync(path.resolve(this.paths.npm, 'package.json'), JSON.stringify(sourceObj), 'utf8');
        this.copyFilesToNpm('.npmignore', '.npmrc', 'README.md', 'LICENSE');
        process.chdir(this.paths.npm);
        child_process_1.execSync('npm publish');
    }
    afterPublish() {
        this.deleteFolder(this.paths.npm);
        this.deleteSrcIndexTs();
    }
    copyFilesToNpm(...fileNames) {
        fileNames.forEach(iterFileName => {
            const filePath = path.resolve(__dirname, iterFileName);
            const destPath = path.resolve(this.paths.npm, iterFileName);
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, destPath);
            }
        });
    }
    deleteFolder(folderPath) {
        if (fs.existsSync(folderPath)) {
            fs.rmdirSync(folderPath, {
                recursive: true
            });
        }
    }
}
new NpmPublish().publish();
//# sourceMappingURL=NpmPublish.js.map