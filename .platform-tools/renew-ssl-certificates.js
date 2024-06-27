const { GrabStringBetween, exec, sleep } = require('./helpers');
const { ChildProcessWrapper } = require('./libs/ChildProcessWrapper')

const domain = 'api.amrcomport.com'
// const domain = 'testsubd2.amrcomport.com'

const certsDestinationDir = '/apps/data'
// const certsDestinationDir = '/apps/test_data2'

async function run(){
    console.log('Launching certbot...');
    await renewCertificates();
    console.log('Copying certificates...');
    await copyCertificatesFiles();
    console.log('Restarting comport-server apps...');
    await exec('pm2 restart comport-server');
    await exec('pm2 restart comport-server-dev');
}

async function copyCertificatesFiles(){
    await Promise.all([
        exec(`sudo cp /etc/letsencrypt/live/${domain}/privkey.pem ${certsDestinationDir}/privkey.pem`),
        exec(`sudo cp /etc/letsencrypt/live/${domain}/cert.pem ${certsDestinationDir}/cert.pem`),
        exec(`sudo cp /etc/letsencrypt/live/${domain}/chain.pem ${certsDestinationDir}/chain.pem`),
    ])
}

async function renewCertificates(){
    await new Promise((resolve, reject) => {
        const certbotCmd = `sudo certbot -d ${domain} --manual --preferred-challenges http certonly`
        const p = new ChildProcessWrapper();
        p.on('error', err => {
            reject(err)
            console.log(p.StderrFullData)
        });

        let gotExistingMessage = false;

        p.Expect(
            "You have an existing certificate that has exactly the same domains or certificate name you requested and isn't close to expiry",
            () => gotExistingMessage = true
        );
        p.Expect(
            "Select the appropriate number [1-2] then [enter] (press 'c' to cancel)",
            () => {
                if(gotExistingMessage) return '2\n';
                else return null;
            }
        );

        p.Expect(
            `http://${domain}/.well-known/acme-challenge`,
            async () => {
                await sleep(500);
                const { content, filename } = GetChallengeValues(p.StdoutFullData);
                await exec(`echo '${content}' > '/var/www/html/.well-known/acme-challenge/${filename}'`);
                await sleep(2000);
                p.Write('\n');
            }
        )
        p.Expect(
            'Successfully received certificate',
            () => resolve()
        )

        p.Spawn(certbotCmd);

        setTimeout(() => reject(new Error('Certificates generation timed out.')), 1000 * 60) // 1 minute timeout
    })
}

function GetChallengeValues(output){
    const content = GrabStringBetween(
        output,
        'Create a file containing just this data:',
        'And make it available on your web server at this URL'
    );
    const fileurl = GrabStringBetween(
        output,
        'And make it available on your web server at this URL',
        '- - - - - - - - - -'
    )
    const filename = GrabStringBetween(
        fileurl + '////',
        '.well-known/acme-challenge/',
        '////'
    )
    return {
        content: content.trim(),
        filename: filename.trim()
    }
}

run()
.catch(err => {
    console.log(err)
    // console.log('error')
})
.finally(() => {
    console.log('Program completed.')
    process.exit()
})