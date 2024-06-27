function GetValueOfD(paramInt1, paramInt2, paramInt3, mXValues)
{
    let i = 0;
    let j = 0;
    if (paramInt1 != 0)
        j = SetBitInByte(j, 2);
    if (paramInt2 != 0)
        j = SetBitInByte(j, 1);
    if (paramInt3 != 0)
        j = SetBitInByte(j, 0);
    i = SetByteInInt(i, mXValues[j][3], 0);
    i = SetByteInInt(i, mXValues[j][2], 1);
    i = SetByteInInt(i, mXValues[j][1], 2);
    i = SetByteInInt(i, mXValues[j][0], 3);
    return i;
}

function GetValueOfG(paramInt1, paramInt2, paramInt3, mXValues)
{
    let i = 0;
    let j = 0;
    if (paramInt1 != 0)
        j = SetBitInByte(j, 2);
    if (paramInt2 != 0)
        j = SetBitInByte(j, 1);
    if (paramInt3 != 0)
        j = SetBitInByte(j, 0);
    i = SetByteInInt(i, mXValues[j][2], 0);
    i = SetByteInInt(i, mXValues[j][1], 1);
    i = SetByteInInt(i, mXValues[j][0], 2);
    i = SetByteInInt(i, mXValues[j][3], 3);
    return i;
}

function GetBitFromByte(paramInt1, paramInt2)
{
    if (paramInt2 > 7)
        return paramInt1;
    paramInt1 &= 0xFF;
    return paramInt1 >> paramInt2 & 0x1;
}

function GetByteFromInt(paramInt1, paramInt2)
{
    if (paramInt2 > 3)
        return paramInt1;
    return paramInt1 >> 8 * paramInt2 & 0xFF;
}

function SetBitInByte(paramInt1, paramInt2)
{
    if (paramInt2 > 7)
        return paramInt1;
    return paramInt1 | 1 << paramInt2;
}

function SetByteInInt(paramInt1, paramInt2, paramInt3)
{
    if (paramInt3 > 3)
        return paramInt1;
    let arrayOfByte = [
        paramInt1 & 0xff,
        (paramInt1 >> 8) & 0xff,
        (paramInt1 >> 16) & 0xff,
        (paramInt1 >> 24) & 0xff
    ]
    arrayOfByte[paramInt3] = paramInt2 & 0xff;
    return (arrayOfByte[3] << 24) + ((arrayOfByte[2] & 0xFF) << 16) + ((arrayOfByte[1] & 0xFF) << 8) + (arrayOfByte[0] & 0xFF);
}

function Matrix(rows, columns){
    const m = new Array(rows)
    for(let i = 0; i < rows; i++){
        m[i] = new Array(columns)
    }
    return m
}

function CalcKeyMed1775(Seed, Consts)
{
    let ConstsInd = 0;
    let mi1, mi2, mi3, mi4, mi5, mi6;
    let mj1, mj2, mj3, mj4, mj5, mj6;

    let mXValues = Matrix(8, 4);

    mi1 = 0;
    mi2 = 2;
    mi3 = 3;
    mi4 = 1;
    mi5 = 0;
    mi6 = 1;
    mj1 = 5;
    mj2 = 1;
    mj3 = 3;
    mj4 = 6;
    mj5 = 7;
    mj6 = 2;


    mXValues[0][0] = Consts[ConstsInd++];
    mXValues[0][1] = Consts[ConstsInd++];
    mXValues[0][2] = Consts[ConstsInd++];
    mXValues[0][3] = Consts[ConstsInd++];
    mXValues[1][0] = Consts[ConstsInd++];
    mXValues[1][1] = Consts[ConstsInd++];
    mXValues[1][2] = Consts[ConstsInd++];
    mXValues[1][3] = Consts[ConstsInd++];
    mXValues[2][0] = Consts[ConstsInd++];
    mXValues[2][1] = Consts[ConstsInd++];
    mXValues[2][2] = Consts[ConstsInd++];
    mXValues[2][3] = Consts[ConstsInd++];
    mXValues[3][0] = Consts[ConstsInd++];
    mXValues[3][1] = Consts[ConstsInd++];
    mXValues[3][2] = Consts[ConstsInd++];
    mXValues[3][3] = Consts[ConstsInd++];
    mXValues[4][0] = Consts[ConstsInd++];
    mXValues[4][1] = Consts[ConstsInd++];
    mXValues[4][2] = Consts[ConstsInd++];
    mXValues[4][3] = Consts[ConstsInd++];
    mXValues[5][0] = Consts[ConstsInd++];
    mXValues[5][1] = Consts[ConstsInd++];
    mXValues[5][2] = Consts[ConstsInd++];
    mXValues[5][3] = Consts[ConstsInd++];
    mXValues[6][0] = Consts[ConstsInd++];
    mXValues[6][1] = Consts[ConstsInd++];
    mXValues[6][2] = Consts[ConstsInd++];
    mXValues[6][3] = Consts[ConstsInd++];
    mXValues[7][0] = Consts[ConstsInd++];
    mXValues[7][1] = Consts[ConstsInd++];
    mXValues[7][2] = Consts[ConstsInd++];
    mXValues[7][3] = Consts[ConstsInd++];

    let arrayOfInt = [];
    arrayOfInt[0] = Seed[3];
    arrayOfInt[1] = Seed[2];
    arrayOfInt[2] = Seed[1];
    arrayOfInt[3] = Seed[0];
    let i = arrayOfInt[mi1] ^ arrayOfInt[mi2];
    let j = GetBitFromByte(arrayOfInt[mi3], mj1);
    let k = GetBitFromByte(arrayOfInt[mi4], mj2);
    let m = GetBitFromByte(i, mj3);
    let n = GetValueOfD(j, k, m, mXValues);
    let i1 = 0;
    i1 = SetByteInInt(i1, arrayOfInt[0], 0);
    i1 = SetByteInInt(i1, arrayOfInt[1], 1);
    i1 = SetByteInInt(i1, arrayOfInt[2], 2);
    i1 = SetByteInInt(i1, arrayOfInt[3], 3);
    let i2 = i1 ^ n;
    let i3 = GetBitFromByte(arrayOfInt[mi5], mj4);
    let i4 = GetBitFromByte(i, mj5);
    let i5 = GetBitFromByte(GetByteFromInt(i2, mi6), mj6);
    let i6 = GetValueOfG(i3, i4, i5, mXValues);
    let i7 = i2 ^ i6;
    var Key = [];
    Key[0] = (((i7 & 0xFF000000) >> 24)) & 0xff;
    Key[1] = (((i7 & 0xFF0000) >> 16)) & 0xff;
    Key[2] = (((i7 & 0xFF00) >> 8)) & 0xff;
    Key[3] = ((i7 & 0xFF)) & 0xff;
    return Key;
}

/**
 * @param {Buffer} Seed 
 * @returns {Buffer}
 */
function GenerateKey(Seed)
{
    const Consts = [
        0x76, 0xDB, 0x31, 0xA8,
        0xCA, 0x10, 0x71, 0x29,
        0xE8, 0x10, 0xBB, 0x55,
        0x10, 0x28, 0x43, 0x1D,
        0x27, 0x69, 0xD1, 0xB7,
        0x42, 0x10, 0x9F, 0xF2,
        0xA8, 0x70, 0x0D, 0xC1,
        0xF0, 0xE1, 0x49, 0x2B
    ]
    const key = CalcKeyMed1775(Seed.toJSON().data, Consts);
    return Buffer.from(key)
}

module.exports = {
    GenerateKey
}


// const testPairs = [
//     { seed: '00000000', key: 'deadea99' },
//     { seed: '00000001', key: 'deadea98' },
//     { seed: '00000002', key: 'deadea9b' },
//     { seed: '00000003', key: 'deadea9a' },
//     { seed: '00000010', key: 'deadea89' },
//     { seed: '10000000', key: 'ceadea99' },
//     { seed: '11111111', key: 'cfbcfb88' },
//     { seed: 'A8542A15', key: '29EE37A5' },
//     { seed: 'e02304a7', key: 'da5afd53' },
//     { seed: '7ba8996e', key: '9d6938d4' },
//     { seed: 'ffffffff', key: 'e0a89bef' },
//     { seed: '032ca290', key: '46ecf136' },
//     { seed: '5b9c0ffd', key: '41cea437' },
//     { seed: '5b9d48e1', key: '26aa5019' },
//     { seed: 'cbe0c1f1', key: '0a1c9988' },
//     { seed: '8241a0d0', key: '3532e175' },
//     { seed: '47a35128', key: 'd85b30ba' },
//     { seed: 'fdfe7f3f', key: '00666245' },
//     { seed: 'aaaaaaaa', key: '2b10b71a' },
//     { seed: 'baaaaaaa', key: '3b10b71a' },
//     { seed: 'abaaaaaa', key: '2a10b71a' },
//     { seed: 'acaaaaaa', key: '2d10b71a' },
//     { seed: 'adaaaaaa', key: '2c10b71a' },
//     { seed: 'aeaaaaaa', key: '2f10b71a' },
//     { seed: 'afaaaaaa', key: '2e10b71a' },
//     { seed: 'a0aaaaaa', key: '2110b71a' },
//     { seed: 'a1aaaaaa', key: '2010b71a' },
//     { seed: 'a2aaaaaa', key: '2310b71a' },
//     { seed: 'a3aaaaaa', key: '2210b71a' },
//     { seed: 'a4aaaaaa', key: '2510b71a' },
//     { seed: 'a5aaaaaa', key: '2410b71a' },
//     { seed: 'a6aaaaaa', key: '2710b71a' },
//     { seed: 'a7aaaaaa', key: '2610b71a' },
//     { seed: 'a8aaaaaa', key: '2910b71a' },
//     { seed: 'a9aaaaaa', key: '2910b71a' },
//     { seed: 'bbbbbbbb', key: '3a01a60b' },
//     { seed: 'a11aaaaa', key: '147a8f28' },
//     { seed: 'a21aaaaa', key: '177a8f28' },
//     { seed: 'a21aaaba', key: '177a8f38' },
//     { seed: 'a31aaaba', key: '167a8f38' },
//     { seed: 'a31aaa2a', key: '22a0b79a' },
//     { seed: 'a21aaa1a', key: '23a0b7aa' },
//     { seed: 'a21aaa2a', key: '23a0b79a' },
//     { seed: 'a21a1a1a', key: '23a007aa' },
//     { seed: 'a21aaa2a', key: '23a0b79a' },
//     { seed: 'a21aaa3a', key: '23a0b78a' },
//     { seed: '99999999', key: '47347300' },
//     { seed: 'daaaaaaa', key: '9acccace' },
//     { seed: 'caaaaaaa', key: '8acccace' },
//     { seed: 'eaaaaaaa', key: '6b10b71a' },
//     { seed: 'faaaaaaa', key: '7b10b71a' },
//     { seed: '0aaaaaaa', key: '4acccace' },
//     { seed: '1aaaaaaa', key: '5acccace' },
//     { seed: '2aaaaaaa', key: 'ab10b71a' },
//     { seed: '3aaaaaaa', key: 'bb10b71a' },
//     { seed: '4aaaaaaa', key: '0acccace' },
//     { seed: '5aaaaaaa', key: '1acccace' },
//     { seed: '6aaaaaaa', key: 'eb10b71a' },
//     { seed: '7aaaaaaa', key: 'fb10b71a' },
//     { seed: '8aaaaaaa', key: 'cacccace' },
//     { seed: '9aaaaaaa', key: 'dacccace' },
//     { seed: 'c3aaaaaa', key: '83cccace' },
//     { seed: 'f4aaaaaa', key: '7510b71a' },
//     { seed: 'f3aaaaaa', key: '7210b71a' },
//     { seed: 'aacaaaaa', key: '2b70b71a' },
//     { seed: 'cccccccc', key: '4855edfb' },
// ]


// for(let pair of testPairs){
//     const seed = Buffer.from(pair.seed, 'hex').toJSON().data
//     const key = GenerateKey(seed)
//     const strKey = Buffer.from(key).toString('hex').toUpperCase()
//     const match = pair.key.toUpperCase() === strKey
//     console.log(`Seed: ${pair.seed.toUpperCase()}, Key: ${pair.key.toUpperCase()}, Generated Key: ${strKey} ${!match ? ' - NO MATCH' : ''}`)
// }