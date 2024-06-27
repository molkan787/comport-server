
function calculate_VGSNAG3_Switchover(device_serial_no){
    const ds = device_serial_no.split('')
    let vp = '0'.repeat(10).split('')
    vp[0] = swap1(ds[9])
    vp[1] = swap1(ds[1])
    vp[2] = swap2(ds[2])
    vp[3] = swap2(ds[3])
    vp[4] = swap3(ds[8])
    vp[5] = ds[4]
    vp[6] = calc1(ds[6])
    vp[7] = swap3(ds[7])
    vp[8] = 'f'
    if(ds[0] === '1') vp[9] = '9'
    else if(ds[0]  === '2') vp[9] = 'a'
    
    const static = '11c40b6848'.split('')

    let _vi = 0
    let _si = 0
    const nextVariable = () => vp[_vi++]
    const nextStatic = () => static[_si++]

    const merged = [
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextStatic(),
        nextStatic(),
        nextVariable(),
        nextStatic(),
        nextVariable(),
        nextVariable(),
        nextVariable(),
    ]

    return merged.join('')
}

function calc1(digit){
    const result = 0x0B - parseInt(digit, 16)
    return result.toString(16)
}

function swap3(digit){
    const table = {
        '0': 'd',
        '1': 'c',
        '2': 'f',
        '3': 'e',
        '4': '9',
        '5': '8',
        '6': 'b',
        '7': 'a',
        '8': '5',
        '9': '4',
    }
    const c = table[digit.toString()]
    if(typeof c !== 'string') throw new Error('Matching digit not found')
    return c
}

function swap2(digit){
    const table = {
        '0': '4',
        '1': '5',
        '2': '6',
        '3': '7',
        '4': '0',
        '5': '1',
        '6': '2',
        '7': '3',
        '8': 'c',
        '9': 'd',
    }
    const c = table[digit.toString()]
    if(typeof c !== 'string') throw new Error('Matching digit not found')
    return c
}

function swap1(digit){
    const table = {
        '0': '2',
        '1': '3',
        '2': '0',
        '3': '1',
        '4': '6',
        '5': '7',
        '6': '4',
        '7': '5',
        '8': 'a',
        '9': 'b',
    }
    const c = table[digit.toString()]
    if(typeof c !== 'string') throw new Error('Matching digit not found')
    return c
}

module.exports = {
    calculate_VGSNAG3_Switchover
}

// const switchover = calculate_VGSNAG3_Switchover('16288016662')
// console.log('switchover: ' + switchover)

// const testItems = [
//     '16288016662',
//     '21058013272',
//     '16275011122',
//     '18125021462',
// ]

// console.table(
//     testItems.map(t => ({
//         serial: t,
//         switchover: calculate_VGSNAG3_Switchover(t)
//     }))
// )

