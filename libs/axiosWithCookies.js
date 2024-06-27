const axios = require('axios');
const cookie = require('cookie');

const cookiesStore = new Map();

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
    config.headers.common['cookie'] = cookies
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
    return Promise.reject(error);
});

axios.defaults.maxBodyLength = 1024 * 1024 * 32;

module.exports = axios