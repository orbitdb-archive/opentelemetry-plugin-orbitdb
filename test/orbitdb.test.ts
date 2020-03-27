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
import * as OrbitDBTypes from 'orbit-db';
import * as IPFSTypes from 'ipfs';
import { plugin, OrbitDBPlugin } from '../src';
// import { AttributeNames } from '../src/enums';

const memoryExporter = new InMemorySpanExporter();

describe('orbit-db@0.23.x', function () {
  const provider = new NodeTracerProvider();
  const tracer = provider.getTracer('external');
  let OrbitDB: typeof OrbitDBTypes.OrbitDB;
  let orbitdb: OrbitDBTypes.OrbitDB;
  let ipfs: IPFSTypes;

  this.timeout(10000);

  let contextManager: AsyncHooksContextManager;
  beforeEach(() => {
    contextManager = new AsyncHooksContextManager().enable();
    context.setGlobalContextManager(contextManager);
  });

  afterEach(() => {
    contextManager.disable();
  });

  before(async function() {
    OrbitDB = require('orbit-db');
    const IPFS = require('ipfs');
    ipfs = await IPFS.create({ silent: true });
    
    provider.addSpanProcessor(new SimpleSpanProcessor(memoryExporter));
    plugin.enable(OrbitDB, provider, new NoopLogger());
  });

  after(async () => {
    await orbitdb.disconnect();
    await ipfs.stop();
    process.exit();
  });

  it('should have correct module name', () => {
    assert.strictEqual(plugin.moduleName, OrbitDBPlugin.COMPONENT);
  });

  describe('#createInstance()', function () {
    it('names the span after orbitdb.id', done => {
      const span = tracer.startSpan('orbit-db');

      tracer.withSpan(span, async () => {
        orbitdb = await OrbitDB.createInstance(ipfs);
        assert.strictEqual(tracer.getCurrentSpan(), span);
        assert.strictEqual(memoryExporter.getFinishedSpans().length, 1);
        span.end();
        const endedSpans = memoryExporter.getFinishedSpans();
        assert.strictEqual(endedSpans.length, 2);
        done();
      });
    });
  });

  describe.skip('#_onPeerConnected()', () => {
    describe.skip('Instrumenting query operations', () => {
        it(`should create a child span for`, done => {
            // const attributes = {
            // ...DEFAULT_ATTRIBUTES,
            // [AttributeNames.DB_STATEMENT]: operation.command,
            // };
            const span = tracer.startSpan('test span');
            tracer.withSpan(span, () => {
                done()
                // operation.method((err, _result) => {
                //     assert.ifError(err);
                //     assert.strictEqual(memoryExporter.getFinishedSpans().length, 1);
                //     span.end();
                //     const endedSpans = memoryExporter.getFinishedSpans();
                //     assert.strictEqual(endedSpans.length, 2);
                //     assert.strictEqual(
                //     endedSpans[0].name,
                //     `redis-${operation.command}`
                //     );
                //     testUtils.assertSpan(
                //     endedSpans[0],
                //     SpanKind.CLIENT,
                //     attributes,
                //     [],
                //     okStatus
                //     );
                //     testUtils.assertPropagation(endedSpans[0], span);
                //     done();
                // });
            });
        });
    });

    describe.skip('Removing instrumentation', () => {
      before(() => {
      });

        it(`should not create a child span for`, done => {
          const span = tracer.startSpan('test span');
          tracer.withSpan(span, () => {
            // operation.method((err, _) => {
            //   assert.ifError(err);
            //   assert.strictEqual(memoryExporter.getFinishedSpans().length, 0);
            //   span.end();
            //   const endedSpans = memoryExporter.getFinishedSpans();
            //   assert.strictEqual(endedSpans.length, 1);
            //   assert.strictEqual(endedSpans[0], span);
              done();
            // });
          });
        });
    });
  });
});