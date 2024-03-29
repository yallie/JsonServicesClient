import { CredentialsBase } from "../src/CredentialsBase"
import { VersionRequest } from "../src/Messages/VersionRequest"
import { IJsonRpcError, isJsonRpcError, JsonClient } from "../src/JsonClient"
import { Calculate } from "./Messages/Calculate"
import { DelayRequest } from "./Messages/DelayRequest"
import { EventBroadcaster } from "./Messages/EventBroadcaster"
import { GetVersion } from "./Messages/GetVersion"

// sample server to connect to
const sampleServerUrl = "ws://127.0.0.1:8765"
const nonExistingServerUrl = "ws://127.0.0.1:8766"

describe("JsonClient", () => {
    it("should compute message name using class name or getTypeName function result", () => {
        const client = new JsonClient(sampleServerUrl)
        expect(client.nameOf(undefined)).toEqual("null")
        expect(client.nameOf(null)).toEqual("null")
        expect(client.nameOf("")).toEqual("null")

        class Sample {}
        expect(client.nameOf(new Sample())).toEqual("Sample")

        expect(client.nameOf(new VersionRequest())).toEqual("rpc.version")
        class AnotherSample {
            public getTypeName = () => "Another"
        }
        expect(client.nameOf(new AnotherSample())).toEqual("Another")
    })

    it("should fail to connect when no server is started", async () => {
        const client = new JsonClient(nonExistingServerUrl)
        const errors: unknown[] = []
        client.errorFilter = (e) => errors.push(e)

        // verify thrown exception
        try {
            await client.connect()
            fail("JsonClient wasn't expected to connect to non-existing server")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32004)
            }
        }

        // verify error filter
        expect(errors).not.toBeNull()
        expect(errors.length).toEqual(1)
        const error = errors[0]
        expect(isJsonRpcError(error)).toBeTruthy()
        if (isJsonRpcError(error)) {
            expect(error.code).toEqual(-32004)
        }

        client.disconnect()
    })
})

// the rest of tests are enabled if JsonServicesSampleServer environment variable is set
// suggested here: https://github.com/facebook/jest/issues/3652
const sampleServer = process.env.JsonServicesSampleServer
const conditional = sampleServer ? describe : describe.skip

conditional("JsonClient", () => {
    it("should connect to the sample service", async () => {
        const client = new JsonClient(sampleServerUrl)
        const sessionId = await client.connect()

        expect(sessionId).toBeTruthy()
        expect(typeof sessionId).toBe("string")
        expect(client.sessionId).toEqual(sessionId)

        await client.disconnect()
    })

    it("should call standard rpc.version service", async () => {
        const client = new JsonClient(sampleServerUrl)
        const sessionId = await client.connect()

        expect(sessionId).toBeTruthy()
        expect(client.sessionId).toEqual(sessionId)

        const version = await client.call(new VersionRequest())
        expect(version).toBeTruthy()
        expect(version.ProductName).toEqual("JsonServicesSampleServer")
        expect(version.EngineVersion).toEqual("0.0.0.1")
        expect(version.ProductVersion).toEqual("0.0.1-beta")

        await client.disconnect()
    })

    it("should call GetVersion service", async () => {
        const client = new JsonClient(sampleServerUrl)
        await client.connect()

        const msg = new GetVersion()
        let result = await client.call(msg)
        expect(result.Version).toEqual("0.01-alpha")

        msg.IsInternal = true
        result = await client.call(msg)
        expect(result.Version).toEqual("Version 0.01-alpha, build 12345, by yallie")

        await client.disconnect()
    })

    it("should connect automatically", async () => {
        const client = new JsonClient(sampleServerUrl)
        expect(client.connected).toBeFalsy()
        client.credentials = new CredentialsBase({
            userName: "foo",
            password: "bar",
        })

        const msg = new GetVersion()
        const result = await client.call(msg)
        expect(result.Version).toEqual("0.01-alpha")
        expect(client.connected).toBeTruthy()

        await client.disconnect()
        expect(client.connected).toBeFalsy()
    })

    it("should fail to authenticate with bad credetials", async () => {
        const client = new JsonClient(sampleServerUrl)
        const errors: unknown[] = []
        client.errorFilter = (e) => errors.push(e)

        // bad credentials that always fail to authenticate
        client.credentials = {
            authenticate: () => {
                throw new Error("Can't authenticate!")
            },
        }

        // verify thrown exception
        try {
            await client.connect()
            fail("JsonClient wasn't expected to connect with bad credentials")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32004)
                expect(e.message).toEqual("Can't authenticate!")
            }
        }

        // verify error filter
        expect(errors).not.toBeNull()
        expect(errors.length).toEqual(1)
        const error = errors[0]
        expect(isJsonRpcError(error)).toBeTruthy()
        if (isJsonRpcError(error)) {
            expect(error.code).toEqual(-32004)
            expect(error.message).toEqual("Can't authenticate!")
        }

        client.disconnect()
    })

    it("should fail to authenticate with another bad credetials", async () => {
        const client = new JsonClient(sampleServerUrl)
        const errors: unknown[] = []
        client.errorFilter = (e) => errors.push(e)

        // bad credentials that always fail to authenticate
        client.credentials = {
            authenticate: async () => {
                const msg = new Calculate()
                msg.FirstOperand = 1
                msg.SecondOperand = 2
                msg.Operation = "#"
                await client.call(msg) // throws
                throw new Error("Never gets here but keeps tsc happy")
            },
        }

        // verify thrown exception
        try {
            await client.connect()
            fail("JsonClient wasn't expected to connect with bad credentials")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32002)
            }
        }

        // verify error filter
        expect(errors).not.toBeNull()
        expect(errors.length).toEqual(1)
        const error = errors[0]
        expect(isJsonRpcError(error)).toBeTruthy()
        if (isJsonRpcError(error)) {
            expect(error.code).toEqual(-32002)
        }

        client.disconnect()
    })

    it("should connect only once", async () => {
        const client = new JsonClient(sampleServerUrl)
        expect(client.connected).toBeFalsy()
        client.credentials = new CredentialsBase({
            userName: "foo",
            password: "bar",
        })

        const msg = new GetVersion()
        const result1 = client.call(msg)
        const result2 = client.call(msg)
        const result3 = client.call(msg)

        let result = await result1
        expect(result.Version).toEqual("0.01-alpha")
        expect(client.connected).toBeTruthy()

        result = await result2
        expect(result.Version).toEqual("0.01-alpha")
        expect(client.connected).toBeTruthy()

        result = await result3
        expect(result.Version).toEqual("0.01-alpha")
        expect(client.connected).toBeTruthy()

        await client.connect()
        expect(client.connected).toBeTruthy()

        await client.disconnect()
        expect(client.connected).toBeFalsy()
    })

    it("should call Calculate service and trigger errors", async () => {
        const client = new JsonClient(sampleServerUrl)
        await client.connect()

        // 353 + 181
        const msg = new Calculate()
        msg.FirstOperand = 353
        msg.Operation = "+"
        msg.SecondOperand = 181
        let result = await client.call(msg)
        expect(result.Result).toEqual(534)

        // 353 - 181
        msg.Operation = "-"
        result = await client.call(msg)
        expect(result.Result).toEqual(172)

        // 353 # 181 — error
        msg.Operation = "#"
        try {
            result = await client.call(msg)
            fail("Service call 353 # 181 should yield an internal server error")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32603)
                expect(e.message).toEqual("Internal server error: Bad operation: #")
                expect(typeof e.data).toEqual("string")
                if (typeof e.data === "string") {
                    expect(e.data.indexOf("Invalid")).toBeGreaterThan(0)
                }
            }
        }

        // 353 % 0
        msg.Operation = "%"
        msg.SecondOperand = 0
        try {
            result = await client.call(msg)
            fail("Service call 353 % 0 should yield a division by zero")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32603)
                expect(e.message.startsWith("Internal server error")).toBeTruthy() // error message is locale-specific
                expect(typeof e.data).toEqual("string")
                if (typeof e.data === "string") {
                    expect(e.data.indexOf("DivideByZero")).toBeGreaterThan(0)
                }
            }
        }

        // 353 * 0
        msg.Operation = "*"
        result = await client.call(msg)
        expect(result.Result).toEqual(0)

        await client.disconnect()
    })

    it("should connect automatically when subscribing to events", async () => {
        const client = new JsonClient(sampleServerUrl)
        expect(client.connected).toBeFalsy()

        let fired = false
        expect(fired).toBeFalsy()

        const unsubscribe = await client.subscribe({
            eventName: "SomeEvent",
            eventHandler: (_) => {
                fired = true
            },
        })

        expect(client.connected).toBeTruthy()
        await unsubscribe()
        await client.disconnect()
        expect(client.connected).toBeFalsy()
    })

    it("should subscribe to and unsubscribe from events", async () => {
        const client = new JsonClient(sampleServerUrl)
        await client.connect()

        let fired = false
        let resolve: any
        let promise = new Promise((r) => (resolve = r))
        const unsubscribe = await client.subscribe({
            eventName: "SomeEvent",
            eventHandler: (_) => {
                fired = true
                resolve(true)
            },
        })

        const msg = new EventBroadcaster()
        msg.EventName = "SomeEvent"
        await client.call(msg)

        // should not time out
        setTimeout(() => resolve(false), 500)
        await promise
        expect(fired).toBeTruthy()

        // reset event handler-related stuff
        fired = false
        promise = new Promise((r) => (resolve = r))
        await unsubscribe()

        await client.call(msg)
        setTimeout(() => resolve(false), 500)

        // should time out
        await promise
        expect(fired).toBeFalsy()

        await client.disconnect()
    })

    it("should fire eventFilter when connection is refused", async () => {
        const badUrl = sampleServerUrl.replace("0", "d")
        const client = new JsonClient(badUrl)

        let fired = false
        let error: Error | IJsonRpcError | unknown = null
        client.errorFilter = (e) => {
            fired = true
            error = e
        }

        try {
            await client.connect()
            fail("Connect didn't throw any exceptions.")
        } catch {
            // ignore
        }

        expect(fired).toBeTruthy()
        expect(error).not.toBeNull()
    })

    it("should fire eventFilter when a call resulted in error", async () => {
        const client = new JsonClient(sampleServerUrl)
        await client.connect()

        let fired = false
        let error: Error | IJsonRpcError | unknown = null
        client.errorFilter = (e) => {
            fired = true
            error = e
        }

        // 353 & 181
        const msg = new Calculate()
        msg.FirstOperand = 353
        msg.Operation = "&"
        msg.SecondOperand = 181

        try {
            await client.call(msg)
            fail("call(353 & 181) should have failed")
        } catch {
            // ignore
        }

        expect(fired).toBeTruthy()
        expect(error).not.toBeNull()
        expect((error as any).code).toEqual(-32603)

        await client.disconnect()
    })

    it("should cancel pending messages when client is disconnected", async () => {
        const client = new JsonClient(sampleServerUrl)
        await client.connect()

        // normal calls
        const version = await client.call(new VersionRequest())
        expect(version.ProductName).toEqual("JsonServicesSampleServer")
        expect(version.ProductVersion).toEqual("0.0.1-beta")
        await client.call(new DelayRequest(10))

        // long call
        const promise = client.call(new DelayRequest(1000))
        client.disconnect()

        try {
            await promise
            fail("The promise should have been rejected")
        } catch (e) {
            expect(isJsonRpcError(e)).toBeTruthy()
            if (isJsonRpcError(e)) {
                expect(e.code).toEqual(-32003)
            }
        }

        await client.disconnect()
    })
})
