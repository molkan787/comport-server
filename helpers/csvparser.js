module.exports = class CSVParser{

    /**
     * @param {Buffer | string} data 
     * @param {(headers: string[]) => void} onHeader
     * @param {(columns: string[]) => void} onDataRow
     */
    static Parse(data, onHeader, onDataRow){
        if(Buffer.isBuffer(data)) data = data.toString('utf-8')
        let isFirstRow = true
        let colsCount = 0
        let row = []
        let column = ''
        const len = data.length
        for(let i = 0; i < len; i++){
            const c = data.charAt(i)
            if(c == '\r') continue;
            if(c == ',' || c == '\n'){
                // column value
                row.push(column.trim())
                column = ''
                if(c == '\n'){
                    if(isFirstRow){
                        isFirstRow = false
                        colsCount = row.length
                        onHeader(row)
                    }else if(row.length === colsCount){
                        onDataRow(row)
                    }
                    row = []
                }
            }else{
                column += c
            }
        }
        row.push(column.trim())
        if(row.length === colsCount){
            onDataRow(row)
        }
    }

    

}