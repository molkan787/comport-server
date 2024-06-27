
function wrap(m, n) {
    return n >= 0n ? n % m : (n % m + m) % m
}
const UINT32_MAXVALUE = 0xFFFFFFFFn
const wrapUInt32 = n => wrap(UINT32_MAXVALUE, n)

/**
 * 
 * @param {bigint} seed 
 * @returns {bigint}
 */
function MG1CS002_SA(seed) {
    if(typeof seed != 'bigint')
        throw new Error('Invalid argument type, Expected BigInt')
        
    let cycle_counter = 7n;  // int
    let iterator = 2n;  // uint
    let cycle_start = 2n;  // uint
    let flag = false;  // bool
    let temp_seed = seed;  // uint
    let temp = 0n;  // uint

    do {
        flag = false;
        temp_seed = temp_seed ^ 0x31072014n;
        temp_seed = wrapUInt32(temp_seed)
        iterator += 5n;

        if (iterator == 7n) {
            temp = 0x01082015n;
            temp_seed += temp;
            temp_seed = wrapUInt32(temp_seed)
            flag = (temp > temp_seed) ? true : false;
            iterator += 5n;
        }

        if (iterator == 0x0Cn) {
            temp = 3n;
            iterator += 2n;
            if (!flag) {
                iterator += temp;
            }
        }

        if (iterator == 0x11n) {
            let u1 = temp_seed & 0x80000000n; // uint
            flag = (u1 > 0n) ? true : false;
            temp_seed <<= 1n;
            temp_seed = wrapUInt32(temp_seed)
            if (flag) {
                temp_seed |= 1n;
                temp_seed = wrapUInt32(temp_seed)
            }
            iterator++;
        }
        else if (iterator == 0x0En) {
            let u2 = temp_seed & 0x00000001n; // uint
            flag = (u2 > 0n) ? true : false;
            temp_seed >>= 1n;
            temp_seed = wrapUInt32(temp_seed)
            if (flag) {
                temp_seed |= 0x80000000n;
                temp_seed = wrapUInt32(temp_seed)
            }
            iterator++;
        }

        if (iterator == 0x0Fn) {
            temp = 6n;
            iterator += temp;
            iterator += 2n;
        }
        else if (iterator == 0x12n) {
            temp = 0x02092016n;
            temp_seed += temp;
            temp_seed = wrapUInt32(temp_seed)
            flag = (temp > temp_seed) ? true : false;
            iterator += 5n;
        }

        if (iterator == 0x17n) {
            temp = 0x03102017n;
            flag = (temp > temp_seed) ? true : false;
            temp_seed -= temp;
            temp_seed = wrapUInt32(temp_seed)
            iterator += 5n;
        }

        if (iterator == 0x1Cn) {
            iterator++;
            if (cycle_counter != 0n) {
                cycle_counter -= 1n;
                if (cycle_counter != 0n) {
                    iterator = cycle_start;
                }
                else {
                    cycle_start--;
                }

            }
            else {
                return temp_seed;
            }
        }
    } while (cycle_counter > 0n);

    return temp_seed;

}

module.exports.MG1CS002_SA = MG1CS002_SA

// const seed = 0xAF03EB9Dn
// const key = MG1CS002_SA(seed)
// const hexKey = key.toString(16).padStart(8, '0')
// console.log('key: ' + hexKey)