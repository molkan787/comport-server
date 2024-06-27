
import json
from pathlib import Path
import string
from sys import argv
from lib import simos_checksum


def fix_checksum_simos8(data: bytes, block_number: int):
    from lib.modules.simos8 import s8_flash_info
    return simos_checksum.validate(s8_flash_info, data, block_number, True)

def fix_checksum_simos10(data: bytes, block_number: int):
    from lib.modules.simos10 import s10_flash_info
    return simos_checksum.validate(s10_flash_info, data, block_number, True)

def fix_checksum_simos12(data: bytes, block_number: int):
    from lib.modules.simos12 import s12_flash_info
    return simos_checksum.validate(s12_flash_info, data, block_number, True)
    
def fix_checksum_simos16(data: bytes, block_number: int):
    from lib.modules.simos16 import s16_flash_info
    return simos_checksum.validate(s16_flash_info, data, block_number, True)
    
def fix_checksum_simos18(data: bytes, block_number: int):
    from lib.modules.simos18 import s18_flash_info
    return simos_checksum.validate(s18_flash_info, data, block_number, True)
    
def fix_checksum_simos122(data: bytes, block_number: int):
    from lib.modules.simos122 import s122_flash_info
    return simos_checksum.validate(s122_flash_info, data, block_number, True)
    
def fix_checksum_simos184(data: bytes, block_number: int):
    from lib.modules.simos184 import s1841_flash_info
    return simos_checksum.validate(s1841_flash_info, data, block_number, True)
    
def fix_checksum_simos1810(data: bytes, block_number: int):
    from lib.modules.simos1810 import s1810_flash_info
    return simos_checksum.validate(s1810_flash_info, data, block_number, True)

def fix_checksum_dq381(data: bytes, block_number: int):
    from lib.modules.dq381 import dsg_flash_info
    from lib import dq381_checksum
    return dq381_checksum.validate(data, block_number, dsg_flash_info, True)

fixers = {
    "simos8": fix_checksum_simos8,
    "simos10": fix_checksum_simos10,
    "simos12": fix_checksum_simos12,
    "simos16": fix_checksum_simos16,
    "simos18": fix_checksum_simos18,
    "simos122": fix_checksum_simos122,
    "simos184": fix_checksum_simos184,
    "simos1810": fix_checksum_simos1810,
    "dq381": fix_checksum_dq381,
}

# Input parsing & loading
input = json.loads(argv[1])
module_name = input["moduleName"]
if(type(module_name) is string):
    module_name = module_name.lower()
input_filename = input["inputFilename"] 
block_number = input["blockNumber"] 
data = Path(input_filename).read_bytes()


# Input validation
if(module_name not in fixers):
    print("error:Unknow module name")
    exit(1)


# Execution
fixer = fixers[module_name]
(checksum, place_offset) = fixer(data, block_number)


# Outputing result
output = {
    "checksum": checksum.hex() if type(checksum) is bytes else checksum,
    "place_offset": place_offset
}
print("output:" + json.dumps(output))



# Testing / Dev code
# data = Path("C:\\Users\\worw7\\Documents\\Comport\\Tmp Files\\asw3.bin").read_bytes()
# block_number = 4
# (checksum, place_offset) = fix_checksum_simos184(data=data, block_number=block_number)