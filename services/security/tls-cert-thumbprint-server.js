class TLSCertThumbprintServerService{

    /** @type {string} */
    static _RawThumbprint = null

    /** @type {string} */
    static _EncryptedThumbprint = '000000'

    static GetEncryptedThumbprint(){
        return this._EncryptedThumbprint
    }

    static Init(rawCertificateString){
        const thumbprint = this.GetRawCertThumbprint(rawCertificateString)
        this._RawThumbprint = thumbprint
        console.log('TLS Certificate Thumbprint:', thumbprint)
        this._EncryptedThumbprint = this.EncryptThumbprint('000000000000000000000000' + thumbprint)
        console.log('Encrypted TLS Certificate Thumbprint:', this._EncryptedThumbprint)
    }

    static GetRawCertThumbprint(rawCertificateString){
        const forge = require('node-forge')
        const cert = forge.pki.certificateFromPem(rawCertificateString)
        const md = forge.md.sha1.create()
        md.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
        const hex = md.digest().toHex()
        return hex
    }


    static _AES_CONFIG = {
        Key: Buffer.from('056926a65b85787844379f1dc1f6c6ae', 'hex'),
        IV: Buffer.from('e7d9a3a7019bd82da6fd84292230b99d', 'hex'),
    }

    static EncryptThumbprint(thumbprint){
        const aesjs = require('aes-js')
        const { Key, IV } = this._AES_CONFIG
        const aesCbc = new aesjs.ModeOfOperation.cbc(Key, IV)
        const encrypted = aesCbc.encrypt(Buffer.from(thumbprint, 'hex'))
        return Buffer.from(encrypted).toString('hex')
    }

}


module.exports = {
    TLSCertThumbprintServerService
}

// test code
// const fs = require('fs')
// const certificate = fs.readFileSync("C:\\Users\\worw7\\Documents\\Comport\\comport-server-cert.pem", 'utf8')
// TLSCertThumbprintServerService.Init(certificate)