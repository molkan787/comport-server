import sys


def infintiMed40_2749001500(seed):
    seed = seed.replace(" ", "")
    if len(seed) != 16:
        print("Error: Seed must be 8 bytes long")
        return
    seedByte1 = int(seed[0:2], 16)
    seedByte2 = int(seed[2:4], 16)
    seedByte3 = int(seed[4:6], 16)
    seedByte4 = int(seed[6:8], 16)
    seedByte5 = int(seed[8:10], 16)
    seedByte6 = int(seed[10:12], 16)
    seedByte7 = int(seed[12:14], 16)
    seedByte8 = int(seed[14:16], 16)

    keyTemp = ((seedByte7 * 0x10000 + seedByte8 * 0x1000000 + seedByte6 * 0x100 + seedByte5) * 0x2b698b4a + 0x6df2) ^ ((seedByte3 * 0x10000 + seedByte4 * 0x1000000 + seedByte2 * 0x100 + seedByte1) * 0x2b698b4a + 0x6df2) ^ 0x3c276d37
    key = (keyTemp & 0xFFFFFFFF)
    key2 = hex(key)[2:]

    print("Output_key:" + key2)
    return key2

infintiMed40_2749001500(sys.argv[1]);
#✓ Seed Received: d6 6b 35 9a 96 4b a5 52
#✓ Key Generated: 2b bb 1f b7