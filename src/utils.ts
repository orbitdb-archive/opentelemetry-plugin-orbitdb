import * as OrbitDBTypes from 'orbit-db';
import * as IPFSTypes from 'ipfs';
import { Tracer, SpanKind, Span, CanonicalCode } from '@opentelemetry/api';
//  import { EventEmitter } from 'events';
import { OrbitDBPlugin } from './orbitdb';
import { AttributeNames } from './enums';

export const endSpan = (span: Span, err?: Error | null) => {
    if (err) {
      span.setStatus({
        code: CanonicalCode.UNKNOWN,
        message: err.message,
      });
    } else {
      span.setStatus({ code: CanonicalCode.OK });
    }
    span.end();
  };

export const getTracedCreateInstanceCommand = (
    tracer: Tracer,
    original: Function
  ) => {
    return async function createInstance_trace(
      ipfs: IPFSTypes
    ) {
        const span = tracer.startSpan(`${OrbitDBPlugin.COMPONENT}-createInstance`, {
          kind: SpanKind.INTERNAL, // Can we petition to add PEER or P2P
          attributes: {
            [AttributeNames.IPFS_VERSION]: ipfs.version,
            [AttributeNames.COMPONENT]: OrbitDBPlugin.COMPONENT,
            [AttributeNames.DB_TYPE]: 'OrbitDB'
          },
        });
         
        // Span will close on disconnect
        try {
          const result = await original.apply(this, arguments);
          span.setAttribute(AttributeNames.ORBIT_ID, result.id)
          return result;
        } catch (rethrow) {
          endSpan(span, rethrow);
          throw rethrow; // rethrow after ending span
        }
      }
  
      // We don't know how to trace this call, so don't start/stop a span
      return original.apply(this, arguments);
  };

  export const getTracedOnPeerConnectedCommand = (
      tracer: Tracer,
      original: Function
    ) => {
      return function _onPeerConnected_trace(
        this: OrbitDBTypes.OrbitDB, // & RedisPluginClientTypes,
        cmd?: RedisCommand
      ) {
        return original.apply(this, arguments);
      }
  };