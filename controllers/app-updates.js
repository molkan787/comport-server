const metadata = require('../db').coll('metadata', 'app-info')

module.exports = async (req, res) => {
    const { httpsPort } = global.httpConfig
    const appName = req.query.app || 'flasher';
    const appInfo = await metadata.findOne({ app: appName })
    const { version, mandatory, filename_prefix } = appInfo || {};
    res.set('Content-Type', 'application/xml')
    res.send(
`<?xml version="1.0" encoding="UTF-8"?>
<item>
    <version>${version}</version>
    <url>https://api.amrcomport.com:${httpsPort}/dl/${filename_prefix}-${version}.zip</url>
    ${mandatory ? `<mandatory mode="${mandatory}">true</mandatory>` : ''}
</item>`
    );
}