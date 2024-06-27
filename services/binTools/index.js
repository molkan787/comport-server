const testTool = require('./tools/testTool')

module.exports = class BinToolsService{

    /**
     *  @typedef {{ microModel: string, toolName: string }} BinToolApplyOptions
     */

    /**
     * @typedef {(bin: Buffer, options: BinToolApplyOptions) => Promise<Buffer>} ToolApplyFunc
     * @type {{[key: string]: { Apply: ToolApplyFunc, DisplayName: string }}}
     */
     static Tools = {
        testTool: testTool
    }

    static GetToolsList(){
        const tools = Object.entries(this.Tools)
        const result = tools.map(([key, tool]) => ({ key: key, displayName: tool.DisplayName }))
        return result
    }


    /**
     * @param {Buffer} bin 
     * @param {BinToolApplyOptions} options 
     * @returns {Promise<Buffer>}
     */
    static async Apply(bin, options){
        const tool = this.Tools[options.toolName]
        const result = await tool.Apply(bin, options)
        return result
    }

}