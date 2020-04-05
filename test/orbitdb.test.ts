import { context } from '@opentelemetry/api'; // SpanKind, CanonicalCode, Status
import { NoopLogger } from '@opentelemetry/core';
import { NodeTracerProvider } from '@opentelemetry/node';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
// import * as testUtils from '@opentelemetry/test-utils';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/tracing';
import * as assert from 'assert';
import * as IPFSTypes from 'ipfs';
import * as OrbitDBTypes from 'orbit-db';
import { plugin, OrbitDBPlugin } from '../src';
import { AttributeNames } from '../src/enums';

const {
  config,
  startIpfs,
  stopIpfs,
  connectPeers,
  waitForPeers,
} = require('orbit-db-test-utils');

const memoryExporter = new InMemorySpanExporter();

describe('orbit-db@0.23.x', function () {
  const provider = new NodeTracerProvider();
  const tracer = provider.getTracer('external');
  const OrbitDB: typeof OrbitDBTypes.OrbitDB = require('orbit-db');

  this.timeout(10000);

  let contextManager: AsyncHooksContextManager;
  beforeEach(() => {
    contextManager = new AsyncHooksContextManager().enable();
    context.setGlobalContextManager(contextManager);
  });

  afterEach(() => {
    contextManager.disable();
  });

  it('should have correct module name', () => {
    assert.strictEqual(plugin.moduleName, OrbitDBPlugin.COMPONENT);
  });

  describe('#createInstance()', function () {
    let orbitdb: OrbitDBTypes.OrbitDB;
    let ipfs: IPFSTypes;

    before(async function() {
      ipfs = await startIpfs('js-ipfs', config.daemon1);
      provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
      plugin.enable(OrbitDB, provider, new NoopLogger());
    });

    after(async () => {
      await orbitdb.stop();
      await stopIpfs(ipfs);
      
      // Make sure the last ended span is the one that closed
      const endedSpans = memoryExporter.getFinishedSpans();
      assert.strictEqual(endedSpans[endedSpans.length - 1].name, `${OrbitDBPlugin.COMPONENT}-${orbitdb.id}`)
    });

    it('sets ipfs.version, component, db.type, and orbit.db span attributes', done => {
      const span = tracer.startSpan('test-#createInstance()');

      tracer.withSpan(span, async () => {
        assert.strictEqual(tracer.getCurrentSpan(), span);
        orbitdb = await OrbitDB.createInstance(ipfs);
        
        // Span created by createInstance stays open until disconnect
        assert.strictEqual(memoryExporter.getFinishedSpans().length, 0);
        const attributes = orbitdb.span.attributes;

        assert.deepStrictEqual(attributes[AttributeNames.IPFS_VERSION], (await orbitdb._ipfs.version()));
        assert.strictEqual(attributes[AttributeNames.COMPONENT], 'orbit-db');
        assert.strictEqual(attributes[AttributeNames.DB_TYPE], 'OrbitDB');
        assert.strictEqual(attributes[AttributeNames.ORBIT_ID], orbitdb.id);
        span.end();

        const endedSpans = memoryExporter.getFinishedSpans();
        assert.strictEqual(endedSpans.length, 1);
        done();
      });
    });
  });

  describe('#_onPeerConnected()', () => {
    let ipfs1: IPFSTypes;
    let ipfs2: IPFSTypes;
    let orbitdb1: OrbitDBTypes.OrbitDB;
    let orbitdb2: OrbitDBTypes.OrbitDB;
  
    before(async () => {
      ipfs1 = await startIpfs('js-ipfs', config.daemon1);
      ipfs2 = await startIpfs('js-ipfs', config.daemon2);
      orbitdb1 = await OrbitDB.createInstance(ipfs1);
      orbitdb2 = await OrbitDB.createInstance(ipfs2);

      await connectPeers(ipfs1, ipfs2);
    })
  
    after(async () => {
      await orbitdb1.stop();
      await orbitdb2.stop();
      await stopIpfs(ipfs1);
      await stopIpfs(ipfs2);
    })
  
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
      })
    });
  });

  // describe('Removing instrumentation', () => {
  //   before(() => {
  //     plugin.disable();
  //   });
  // });
});
