"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
//  import { EventEmitter } from 'events';
const orbitdb_1 = require("./orbitdb");
const enums_1 = require("./enums");
exports.endSpan = (span, err) => {
    if (err) {
        span.setStatus({
            code: api_1.CanonicalCode.UNKNOWN,
            message: err.message,
        });
    }
    else {
        span.setStatus({ code: api_1.CanonicalCode.OK });
    }
    span.end();
};
exports.getTracedCreateInstanceCommand = (tracer, original) => {
    return async function createInstance_trace(ipfs) {
        try {
            const result = await original.apply(this, arguments);
            // attach global span to returned orbitdb object
            let span = tracer.startSpan(`${orbitdb_1.OrbitDBPlugin.COMPONENT}-${result.id}`, {
                kind: api_1.SpanKind.INTERNAL,
                attributes: {
                    [enums_1.AttributeNames.IPFS_VERSION]: (await ipfs.version()),
                    [enums_1.AttributeNames.COMPONENT]: orbitdb_1.OrbitDBPlugin.COMPONENT,
                    [enums_1.AttributeNames.DB_TYPE]: 'OrbitDB',
                    [enums_1.AttributeNames.ORBIT_ID]: result.id
                },
            });
            // Span will close on disconnect
            result.span = span;
            return result;
        }
        catch (rethrow) {
            throw rethrow;
        }
    };
};
exports.getTracedDisconnectCommand = (tracer, original) => {
    return function disconnect_trace() {
        try {
            exports.endSpan(this.span);
        }
        catch (rethrow) {
            exports.endSpan(this.span, rethrow);
        }
        return original.apply(this, arguments);
    };
};
exports.getTracedOnPeerConnectedCommand = (tracer, original) => {
    return function _onPeerConnected_trace(address, peer) {
        let span = tracer.startSpan(`${orbitdb_1.OrbitDBPlugin.COMPONENT}-${peer}-#_onPeerConnected`, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: {
                [enums_1.AttributeNames.COMPONENT]: orbitdb_1.OrbitDBPlugin.COMPONENT,
                [enums_1.AttributeNames.DB_TYPE]: 'OrbitDB',
                [enums_1.AttributeNames.ORBIT_ADDRESS]: address,
                [enums_1.AttributeNames.ORBIT_ID]: peer
            },
        });
        try {
            const result = original.apply(this, arguments);
            exports.endSpan(span);
            return result;
        }
        catch (rethrow) {
            exports.endSpan(span, rethrow);
            return;
        }
    };
};
//# sourceMappingURL=utils.js.map