const { spawn } = require('child_process');
const EventEmitter = require('events');


class ChildProcessWrapper extends EventEmitter{

    /**
     * @private
     * @type {import('child_process').ChildProcessWithoutNullStreams}
     */
    proc = null;

    /** @private */
    stdoutData = '';
    
    /** @private */
    stderrData = '';

    get StdoutFullData(){
        return this.stdoutData;
    }

    get StderrFullData(){
        return this.stderrData;
    }

    /**
     * @private
     */
    get debug(){
        return true;
    }

    /**
     * @private
     * @type {{expect: string, response: string | ((data: string) => string)}[]}
     */
    expectations = []

    /**
     * @public
     * @param {string} command 
     * @param {import('child_process').SpawnOptionsWithoutStdio | undefined} options 
     */
    Spawn(command, options){
        const [cmd, ...args] = command.split(' ').filter(p => p.trim().length > 0)
        const p = spawn(cmd, args, options);
        this.proc = p;
        p.stdout.on('data', data => this.handleStdoutData(data));
        p.stderr.on('data', data => this.stderrData += data.toString('ascii'));
        p.on('error', err => this.emit('error', err))
        return this;
    }

    /**
     * @private
     * @param {Buffer} data 
     */
    handleStdoutData(data){
        const strData = data.toString('ascii');
        this.stdoutData += strData;
        if(this.debug){
            console.log(strData)
        }
        this.checkExpectations(strData);
    }

    /**
     * @private
     * @param {string} data 
     */
    async checkExpectations(data){
        const d = data.toLowerCase();
        for(let e of this.expectations){
            const { expect, response } = e;
            if(d.includes(expect.toLowerCase())){
                if(typeof response == 'string'){
                    await this.Write(response);
                }else if(typeof response == 'function'){
                    const actualResponse = await response();
                    if(typeof actualResponse == 'string' && actualResponse.length > 0){
                        await this.Write(actualResponse);
                    }
                }
            }
        }
    }
    

    /**
     * @public
     * @param {string | Buffer | Uint8Array} data 
     * @returns {Promise<boolean>}
     */
    Write(data){
        return new Promise((resolve, reject) => {
            const result = this.proc.stdin.write(data, err => {
                if(err) reject(err);
                else resolve(result);
            })
        })
    }

    /**
     * @public
     * @param {string} promptText 
     * @param {string | ((data: string) => string)} response 
     */
    Expect(promptText, response){
        this.expectations.push({
            expect: promptText,
            response: response
        })
    }

}

module.exports = {
    ChildProcessWrapper
}