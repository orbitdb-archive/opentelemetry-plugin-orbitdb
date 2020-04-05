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
      this: OrbitDBTypes.OrbitDB,
      ipfs: IPFSTypes
    ) {
        try {
          const result = await original.apply(this, arguments);

          // attach global span to returned orbitdb object
          let span: Span = tracer.startSpan(`${OrbitDBPlugin.COMPONENT}-${result.id}`, {
            kind: SpanKind.INTERNAL,
            attributes: {
              [AttributeNames.IPFS_VERSION]: (await ipfs.version()),
              [AttributeNames.COMPONENT]: OrbitDBPlugin.COMPONENT,
              [AttributeNames.DB_TYPE]: 'OrbitDB',
              [AttributeNames.ORBIT_ID]: result.id
            },
          });

          // Span will close on disconnect
          result.span = span;
          return result;
        } catch (rethrow) {
          throw rethrow;
        }
      }
  };

  export const getTracedDisconnectCommand = (
      tracer: Tracer,
      original: Function
    ) => {
      return function disconnect_trace(this: OrbitDBTypes.OrbitDB) {
        try {
          endSpan(this.span)
        } catch (rethrow) {
          endSpan(this.span, rethrow)
        }
        return original.apply(this, arguments);
      }
  };

  export const getTracedOnPeerConnectedCommand = (
      tracer: Tracer,
      original: Function
    ) => {
      return function _onPeerConnected_trace(
        this: OrbitDBTypes.OrbitDB,
        address: string,
        peer: string
      ) {
        let span: Span = tracer.startSpan(`${OrbitDBPlugin.COMPONENT}-${peer}-#_onPeerConnected`, {
          kind: SpanKind.INTERNAL,
          attributes: {
            [AttributeNames.COMPONENT]: OrbitDBPlugin.COMPONENT,
            [AttributeNames.DB_TYPE]: 'OrbitDB',
            [AttributeNames.ORBIT_ADDRESS]: address,
            [AttributeNames.ORBIT_ID]: peer
          },
        });
 
        try {
          const result = original.apply(this, arguments);
          endSpan(span)
          return result;
        } catch (rethrow) {
          endSpan(span, rethrow)
          return;
        }
      }
  };
