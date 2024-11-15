/**
 * Finds line of text that starts with the specified prefix string `dataPrefix`
 * @param {string} text 
 * @param {string} dataPrefix The string that comes just before the data to return (default = 'output_data:')
 * @returns {string}
 */
function grabData(output, dataPrefix){
    const prefix = dataPrefix || 'output_data:'
    const lines = output.split('\n')
    for(let i = 0; i < lines.length; i++){
        const ln = lines[i].trim()
        if(ln.startsWith(prefix)){
            const keyHexStr = ln.substring(prefix.length).trim()
            return keyHexStr
        }
    }
    return null
}

/**
 * 
 * @param {string} target 
 * @param {string | string[]} search 
 */
function contains(target, search){
    const t = target.toLowerCase()
    const ss = Array.isArray(search) ? search : [search]
    const len = ss.length
    for(let i = 0; i < len; i++){
        const s = ss[i].toLowerCase()
        if(t.includes(s)){
            return true
        }
    }
    return false
}


module.exports = {
    grabData,
    contains,
}