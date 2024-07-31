const { NodeSSH } = require('node-ssh')
const AdmZip = require('adm-zip')
const path = require('path')
const { promises: fs } = require('fs')

const ssh = new NodeSSH()

const IsProd = process.argv.includes('--prod') || process.argv.includes('--production')
const { SSH: sshConfig, UploadDir, AppDir: AppDirByEnvs } = require('./config.json')
const AppDir = IsProd ? AppDirByEnvs.Prod : AppDirByEnvs.Dev

async function run(){
    console.log(`Deploying for '${IsProd ? 'Production' : 'Developement'}' mode.`)
    const REMOTE_UPLOAD_FILENAME = unixPathJoin(UploadDir, 'comport-server-app.zip')
    console.log('Packing application...')
    const packedAppFile = await packTheApp()
    console.log('Establishing SSH connection...')
    await ssh.connect({
        host: sshConfig.ServerIp,
        username: sshConfig.Username,
        password: sshConfig.Password
    })
    console.log('Transfering app...')
    await ssh.putFile(packedAppFile, REMOTE_UPLOAD_FILENAME)
    console.log('Unpacking app...')
    await unpackTheApp(ssh, REMOTE_UPLOAD_FILENAME)

    ssh.dispose()
}

async function packTheApp(){
    const IGNORE = ['.deployer', '.git', 'node_modules', 'public', 'migrations', '.prod']
    const appSourcesDir = path.join(__dirname, '..')
    const allItems = await fs.readdir(appSourcesDir)
    const items = allItems.filter(f => !IGNORE.includes(f))
    const zip = new AdmZip()
    for(let item of items){
        const fullPath = path.join(appSourcesDir, item)
        const stats = await fs.lstat(fullPath)
        if(stats.isDirectory()){
            zip.addLocalFolder(fullPath, item)
        }else if(stats.isFile()){
            zip.addLocalFile(fullPath, '')
        }
    }
    if(IsProd){
        zip.addFile('.prod', Buffer.from('', 'utf-8'))
    }
    const outputZipFilename = path.join(__dirname, 'temp', 'app.zip')
    await zip.writeZipPromise(outputZipFilename)
    return outputZipFilename
}

/**
 * 
 * @param {NodeSSH} sshClient 
 * @param {string} remoteAppFile 
 */
async function unpackTheApp(sshClient, remoteAppFile){
    const iee = '> /dev/null; true';
    const appName = path.basename(AppDir)
    const cmds = [
        `rm -rf '${unixPathJoin(UploadDir, 'tmp_public')}'`,
        `rm -rf '${unixPathJoin(UploadDir, 'tmp_node_modules')}'`,
        `rm -rf '${unixPathJoin(UploadDir, 'tmp_programs')}'`,
        `mv '${unixPathJoin(AppDir, 'public')}' '${unixPathJoin(UploadDir, 'tmp_public')}' ${iee}`,
        `mv '${unixPathJoin(AppDir, 'node_modules')}' '${unixPathJoin(UploadDir, 'tmp_node_modules')}' ${iee}`,
        `mv '${unixPathJoin(AppDir, 'resources/programs')}' '${unixPathJoin(UploadDir, 'tmp_programs')}' ${iee}`,
        `rm -rf '${AppDir}'`,
        `mkdir '${AppDir}'`,
        `mkdir '${unixPathJoin(AppDir, 'resources')}'`,
        `mv '${unixPathJoin(UploadDir, 'tmp_programs')}' '${unixPathJoin(AppDir, 'resources/programs')}' ${iee}`,
        `unzip -o '${remoteAppFile}' -d '${AppDir}'`,
        `mv '${unixPathJoin(UploadDir, 'tmp_public')}' '${unixPathJoin(AppDir, 'public')}' ${iee}`,
        `mkdir '${unixPathJoin(AppDir, 'public')}' ${iee}`, // try to create the dir in case we did not have an existing one
        `mv '${unixPathJoin(UploadDir, 'tmp_node_modules')}' '${unixPathJoin(AppDir, 'node_modules')}' ${iee}`,
        'yarn --production',
        `pm2 stop '${appName}'`,
        `pm2 start '${appName}'`
    ]
    for(let cmd of cmds){
        const response = await sshClient.execCommand(cmd, { cwd: AppDir })
        if(typeof response.code == 'number' && response.code !== 0){
            console.error(`Command \`${cmd}\` failed:\n`)
            console.error(response.stderr)
            console.log('----------------------------------------------------------')
            if(typeof response.stdout == 'string' && response.stdout.trim().length > 0){
                console.log(response.stdout)
                console.log('----------------------------------------------------------')
            }
            process.exit(response.code)
        }
    }
}

function unixPathJoin(p1, p2){
    if(p1.endsWith('/')) return p1 + p2
    else return `${p1}/${p2}`
}


run()
.catch(err => console.error(err))
.finally(() => console.log('Program completed.'))