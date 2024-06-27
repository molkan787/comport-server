const { WrapRouteHandler } = require("../helpers/controller-helpers");
const { TLSCertThumbprintServerService } = require("../services/security/tls-cert-thumbprint-server");

const GetTLSCertThumbprint = (req, res) => WrapRouteHandler(
    req, res, null,
    () => ({
        Hash: TLSCertThumbprintServerService.GetEncryptedThumbprint()
    })
)

module.exports = {
    GetTLSCertThumbprint
}