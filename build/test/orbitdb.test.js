"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api"); // SpanKind, CanonicalCode, Status
const core_1 = require("@opentelemetry/core");
const node_1 = require("@opentelemetry/node");
const context_async_hooks_1 = require("@opentelemetry/context-async-hooks");
// import * as testUtils from '@opentelemetry/test-utils';
const tracing_1 = require("@opentelemetry/tracing");
const assert = __importStar(require("assert"));
const src_1 = require("../src");
const enums_1 = require("../src/enums");
const { config, startIpfs, stopIpfs, connectPeers, waitForPeers, } = require('orbit-db-test-utils');
const memoryExporter = new tracing_1.InMemorySpanExporter();
describe('orbit-db@0.23.x', function () {
    const provider = new node_1.NodeTracerProvider();
    const tracer = provider.getTracer('external');
    const OrbitDB = require('orbit-db');
    this.timeout(10000);
    let contextManager;
    beforeEach(() => {
        contextManager = new context_async_hooks_1.AsyncHooksContextManager().enable();
        api_1.context.setGlobalContextManager(contextManager);
    });
    afterEach(() => {
        contextManager.disable();
    });
    it('should have correct module name', () => {
        assert.strictEqual(src_1.plugin.moduleName, src_1.OrbitDBPlugin.COMPONENT);
    });
    describe('#createInstance()', function () {
        let orbitdb;
        let ipfs;
        before(async function () {
            ipfs = await startIpfs('js-ipfs', config.daemon1);
            provider.addSpanProcessor(new tracing_1.SimpleSpanProcessor(memoryExporter));
            src_1.plugin.enable(OrbitDB, provider, new core_1.NoopLogger());
        });
        after(async () => {
            await orbitdb.stop();
            await stopIpfs(ipfs);
            // Make sure the last ended span is the one that closed
            const endedSpans = memoryExporter.getFinishedSpans();
            assert.strictEqual(endedSpans[endedSpans.length - 1].name, `${src_1.OrbitDBPlugin.COMPONENT}-${orbitdb.id}`);
        });
        it('sets ipfs.version, component, db.type, and orbit.db span attributes', done => {
            const span = tracer.startSpan('test-#createInstance()');
            tracer.withSpan(span, async () => {
                assert.strictEqual(tracer.getCurrentSpan(), span);
                orbitdb = await OrbitDB.createInstance(ipfs);
                // Span created by createInstance stays open until disconnect
                assert.strictEqual(memoryExporter.getFinishedSpans().length, 0);
                const attributes = orbitdb.span.attributes;
                assert.deepStrictEqual(attributes[enums_1.AttributeNames.IPFS_VERSION], (await orbitdb._ipfs.version()));
                assert.strictEqual(attributes[enums_1.AttributeNames.COMPONENT], 'orbit-db');
                assert.strictEqual(attributes[enums_1.AttributeNames.DB_TYPE], 'OrbitDB');
                assert.strictEqual(attributes[enums_1.AttributeNames.ORBIT_ID], orbitdb.id);
                span.end();
                const endedSpans = memoryExporter.getFinishedSpans();
                assert.strictEqual(endedSpans.length, 1);
                done();
            });
        });
    });
    describe('#_onPeerConnected()', () => {
        let ipfs1;
        let ipfs2;
        let orbitdb1;
        let orbitdb2;
        before(async () => {
            ipfs1 = await startIpfs('js-ipfs', config.daemon1);
            ipfs2 = await startIpfs('js-ipfs', config.daemon2);
            orbitdb1 = await OrbitDB.createInstance(ipfs1);
            orbitdb2 = await OrbitDB.createInstance(ipfs2);
            await connectPeers(ipfs1, ipfs2);
        });
        after(async () => {
            await orbitdb1.stop();
            await orbitdb2.stop();
            await stopIpfs(ipfs1);
            await stopIpfs(ipfs2);
        });
        it(`should create a child span for`, done => {
            const span = tracer.startSpan('test-#_onPeerConnected()');
            tracer.withSpan(span, async () => {
                const db1 = await orbitdb1.kvstore('testing');
                const db2 = await orbitdb2.kvstore(db1.address.toString());
                await waitForPeers(ipfs1, [orbitdb2.id], db1.address.toString());
                await waitForPeers(ipfs2, [orbitdb1.id], db1.address.toString());
                await db1.drop();
                await db2.drop();
                const endedSpans = memoryExporter.getFinishedSpans();
                console.log(endedSpans);
                // Hack to make sure all event handlers are done firing
                setTimeout(done, 1000);
            });
        });
    });
    // describe('Removing instrumentation', () => {
    //   before(() => {
    //     plugin.disable();
    //   });
    // });
});
//# sourceMappingURL=orbitdb.test.js.map