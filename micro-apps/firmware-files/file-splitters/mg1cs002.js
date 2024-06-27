const { ExtractBlocksToZip } = require('./shared')

/**
 * @param {import('../typings/file-spliter').SplitFileOptions} options 
 */
async function split(options){
    const { isStock } = options
    const blocks = isStock ? StockFileBlocks : TunedFileBlocks
    const zipStream = await ExtractBlocksToZip(options, blocks)
    return zipStream
}

module.exports = {
    split
}

// Stock File MG1CS002_VAG & MG1CS002_971
const StockFileBlocks = [
    { Name: 'Block1', Offset: 0x4000, Length: 0x28000 },
    { Name: 'Block2', Offset: 0x2C000, Length: 0x340000 },
    { Name: 'Block3', Offset: 0x36C000, Length: 0x2C0000 },
    { Name: 'Block4', Offset: 0x0, Length: 0x004000 },
    { Name: 'Block5', Offset: 0x62C000, Length: 0x180000 },
]
//-------------------------------------------------------------------------------
// Tuned File MG1CS002_971
const TunedFileBlocks = [
    { Name: 'Block1', Offset: 0x4000, Length: 0x28000 },
    { Name: 'Block2', Offset: 0x4000, Length: 0x28000 },
    { Name: 'Block3', Offset: 0x4000, Length: 0x28000 },
    { Name: 'Block4', Offset: 0x2C000, Length: 0x340000 },
    { Name: 'Block5', Offset: 0x36C000, Length: 0x2C0000 },
    { Name: 'Block6', Offset: 0x0, Length: 0x4000 },
    { Name: 'Block7', Offset: 0x62C000, Length: 0x180000 },
]