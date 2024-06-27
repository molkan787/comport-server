/**
 * @typedef {{ microModel: string, toolName: string }} BinToolApplyOptions
 * @param {Buffer} bin 
 * @param {BinToolApplyOptions} options 
 */
function Apply(bin, options){
    const micro = options.microModel.toLowerCase()
    return (micro === 'med1775' ? med1775 : allMicros)(bin)
}

module.exports = {
    Apply,
    DisplayName: 'Test Tool'
}

/**
 * @param {Buffer} bin 
 */
async function med1775(bin){
    return bin.map(b => b == 0x00 ? 0x01 : b)
}

/**
 * @param {Buffer} bin 
 */
 async function allMicros(bin){
    return bin.map(b => b == 0x00 ? 0x02 : b)
}