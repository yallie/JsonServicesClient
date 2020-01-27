import { EventFilter } from "../src/EventFilter"

describe("EventFilter", () => {
    test("empty filter matches anything", () => {
        expect(EventFilter.matches(null, null)).toBeTruthy()
        expect(EventFilter.matches(undefined, null)).toBeTruthy()
        expect(EventFilter.matches(null, undefined)).toBeTruthy()
        expect(EventFilter.matches({}, null)).toBeTruthy()
        expect(EventFilter.matches({}, undefined)).toBeTruthy()
        expect(EventFilter.matches({ a: "0" }, { a: "0" })).toBeTruthy()
    })

    test("filter with empty property matches an argument that has this property", () => {
        expect(EventFilter.matches({ a: null }, undefined)).toBeFalsy()
        expect(EventFilter.matches({ a: null }, {})).toBeFalsy()
        expect(EventFilter.matches({ a: null }, { a: undefined })).toBeFalsy()
        expect(EventFilter.matches({ a: null }, { a: null })).toBeTruthy()
        expect(EventFilter.matches({ a: null }, { a: "Hello" })).toBeTruthy()

        expect(EventFilter.matches({ a: "" }, undefined)).toBeFalsy()
        expect(EventFilter.matches({ a: "" }, {})).toBeFalsy()
        expect(EventFilter.matches({ a: "" }, { a: undefined })).toBeFalsy()
        expect(EventFilter.matches({ a: "" }, { a: null })).toBeTruthy()
        expect(EventFilter.matches({ a: "" }, { a: "Hello" })).toBeTruthy()
    })

    test("missing property doesn't match the filter", () => {
        let filter = { name: "Bozo"}
        expect(EventFilter.matches(filter, undefined)).toBeFalsy()
        expect(EventFilter.matches(filter, null)).toBeFalsy()
        expect(EventFilter.matches(filter, {})).toBeFalsy()
        expect(EventFilter.matches(filter, { name: "Bonzo" })).toBeFalsy()
        expect(EventFilter.matches(filter, { name: "Bozo" })).toBeTruthy()
    })

    test("stringMatches test cases", () => {
        expect(EventFilter.stringMatches(null, null)).toBeTruthy()
        expect(EventFilter.stringMatches(null, undefined)).toBeTruthy()
        expect(EventFilter.stringMatches(undefined, null)).toBeTruthy()
        expect(EventFilter.stringMatches("", null)).toBeTruthy()
        expect(EventFilter.stringMatches(null, "")).toBeTruthy()
        expect(EventFilter.stringMatches("foo", "SomeFoo")).toBeTruthy()
        expect(EventFilter.stringMatches("goo", "SomeFoo")).toBeFalsy()
    })

    test("numberMatches test cases", () => {
        expect(EventFilter.numberMatches(null, null)).toBeTruthy()
        expect(EventFilter.numberMatches(null, 1)).toBeTruthy()
        expect(EventFilter.numberMatches(undefined, 1)).toBeTruthy()
        expect(EventFilter.numberMatches("123", 123)).toBeTruthy()
        expect(EventFilter.numberMatches("123", 45)).toBeFalsy()
        expect(EventFilter.numberMatches("123", null)).toBeFalsy()
        expect(EventFilter.numberMatches("12345", 123)).toBeFalsy()
        expect(EventFilter.numberMatches("123,45", 123)).toBeTruthy()
        expect(EventFilter.numberMatches("123,45.67", 45.67)).toBeTruthy()

        expect(EventFilter.matches({ "a": "10" }, { "a": 10 })).toBeTruthy()
        expect(EventFilter.matches({ "b": "1,2,3" }, { "b": 3 })).toBeTruthy()
        expect(EventFilter.matches({ "b": "1,2,3" }, { "b": 4 })).toBeFalsy()
    })

    test("boolMatches test cases", () => {
        expect(EventFilter.boolMatches(null, null)).toBeTruthy()
        expect(EventFilter.boolMatches(null, true)).toBeTruthy()
        expect(EventFilter.boolMatches(undefined, false)).toBeTruthy()
        expect(EventFilter.boolMatches("TRUE", true)).toBeTruthy()
        expect(EventFilter.boolMatches("false", true)).toBeFalsy()
        expect(EventFilter.boolMatches("true", false)).toBeFalsy()
        expect(EventFilter.boolMatches("FALSE", false)).toBeTruthy()
        expect(EventFilter.boolMatches("True", true)).toBeTruthy()

        expect(EventFilter.matches({ "a": "true" }, { "a": true })).toBeTruthy()
        expect(EventFilter.matches({ "b": "false" }, { "b": false })).toBeTruthy()
        expect(EventFilter.matches({ "b": "false" }, { "b": true })).toBeFalsy()
    })

    test("eventArgs with string property tests", () => {
        const arg = { Name: null }
        expect(EventFilter.matches({ Name: null }, arg)).toBeTruthy()
        expect(EventFilter.matches({ Name: "null" }, arg)).toBeFalsy()
        expect(EventFilter.matches({ Name: "Bozo" }, arg)).toBeFalsy()

        const arg2 = { Name: "BGWJJILLIGKKK" }
        expect(EventFilter.matches({ Name: null }, arg2)).toBeTruthy()
        expect(EventFilter.matches({ Name: "Bozo" }, arg2)).toBeFalsy()
        expect(EventFilter.matches({ Name: "BGWJJILLIGKKK" }, arg2)).toBeTruthy()
        expect(EventFilter.matches({ Name: "jill" }, arg2)).toBeTruthy()
        expect(EventFilter.matches({ Name: "jilll" }, arg2)).toBeFalsy()
    })
})
