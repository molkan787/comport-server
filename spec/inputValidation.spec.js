const { ValidateStringParams, ValidateParams } = require("../helpers/inputValidation")
const { createMockHttpResponseObject } = require("./mocks/http-objects-mock")

describe('Input String Params Validator', function () {

    it('should return true when providing a none empty string', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateStringParams(res, { testProp1: 'test value' })
        expect(result).toBe(true)
    })

    it('should return false and respond with error when providing an empty string', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateStringParams(res, { testProp1: '' })
        expect(result).toBe(false)
    })
    
    it('should return true when providing an empty string and explicitly allowing empty string', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateStringParams(res, { testProp1: '' }, true)
        expect(result).toBe(true)
    })

})

describe('Input Params Validator', function () {

    it('should return true when providing a none empty string and specifying "NoneEmptyString" as the validator', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateParams(res, { testProp1: 'test value' }, { testProp1: 'NoneEmptyString' })
        expect(result).toBe(true)
    })
    
    it('should return false and respond with error when providing an empty string and specifying "NoneEmptyString" as the validator', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateParams(res, { testProp1: '' }, { testProp1: 'NoneEmptyString' })
        expect(result).toBe(false)
    })
    
    it('should return true when providing a `Buffer` instance and specifying "Buffer" as the validator', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateParams(res, { testProp1: Buffer.from('') }, { testProp1: 'Buffer' })
        expect(result).toBe(true)
    })
    
    it('hould return false when providing a other value than `Buffer` instance and specifying "Buffer" as the validator', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateParams(res, { testProp1: {} }, { testProp1: 'Buffer' })
        expect(result).toBe(false)
    })
    
    it('hould return false when providing `undefined` as value and specifying "Buffer" as the validator', function () {
        const res = createMockHttpResponseObject()
        const result = ValidateParams(res, { testProp1: undefined }, { testProp1: 'Buffer' })
        expect(result).toBe(false)
    })

})