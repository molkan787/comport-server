const axioslib = require('axios');
const cookie = require('cookie');
const HttpsProxyAgent = require('https-proxy-agent');


/**
 * @param {{ proxy: import('../core-services/typings/ProxyItemConfig').ProxyConfigItem }} config 
 */
const createInstance = (config) => {
    const cookiesStore = new Map();
    const { host, port, auth: { username, password } } = config.proxy
    const axios = axioslib.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent.HttpsProxyAgent(`http://${username}:${password}@${host}:${port}`)
        // proxy: config.proxy
    })

    function storeCookies(response){
        const rawcookies = response.headers['set-cookie'] || [];
        for(let rawCookie of rawcookies){
            const entries = Object.entries(cookie.parse(rawCookie))
            for(let entry of entries){
                const [name, value] = entry
                if(name !== 'Path' && name !== 'Expires'){
                    cookiesStore.set(name, value)
                }
            }
        }
    }

    function useCookies(config){
        const cookies = Array.from(cookiesStore.entries()).map(([name, value]) => `${name}=${value};`)
        config.headers['cookie'] = cookies
        config.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) electron/1.0.0 Chrome/53.0.2785.113 Electron/1.4.3 Safari/537.36'
    }

    axios.interceptors.request.use((config) => {
        useCookies(config)
        return config
    }, (error) => {
        return Promise.reject(error);
    })

    axios.interceptors.response.use((response) => {
        storeCookies(response)
        return response;
    }, (error) => {
        console.dir(error)
        return Promise.reject('ERR!!');
    });

    axios.defaults.maxBodyLength = 1024 * 1024 * 32;

    return axios
}

module.exports = {
    createInstance
}