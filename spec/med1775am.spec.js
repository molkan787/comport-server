const MED1775AM = require('../algorithms/MED1775AM')

describe('Security Algorithm MED1775AM', function (){
    it('Should generate the correct key', function (){
        const seed = Buffer.from('8241a0d0', 'hex')
        const key = MED1775AM.GenerateKey(seed)
        const strKey = Buffer.from(key).toString('hex').toUpperCase()
        expect(strKey.toLowerCase()).toBe('3532e175')
    })
})