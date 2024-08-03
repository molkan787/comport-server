const https = require("node:https");

export const handler = async (event) => {

    const headers = Object.assign({}, event.headers)
    delete headers.host


    const options = {
        hostname: 'api.amrcomport.com',
        port: 8086,
        path: '/webhooks/create-customer',
        method: 'POST',
        headers: headers
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: responseBody
                });
            });
        });

        req.on('error', (error) => {
            console.error(`Request error: ${error}`);
            reject({
                statusCode: 502,
                body: JSON.stringify({ error: 'Bad Gateway', message: error.message })
            });
        });

        req.write(event.body);
        req.end();
    });
};