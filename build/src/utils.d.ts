import * as OrbitDBTypes from 'orbit-db';
import * as IPFSTypes from 'ipfs';
import { Tracer, Span } from '@opentelemetry/api';
export declare const endSpan: (span: Span, err?: Error | null | undefined) => void;
export declare const getTracedCreateInstanceCommand: (tracer: Tracer, original: Function) => (this: OrbitDBTypes.OrbitDB, ipfs: IPFSTypes) => Promise<any>;
export declare const getTracedDisconnectCommand: (tracer: Tracer, original: Function) => (this: OrbitDBTypes.OrbitDB) => any;
export declare const getTracedOnPeerConnectedCommand: (tracer: Tracer, original: Function) => (this: OrbitDBTypes.OrbitDB, address: string, peer: string) => any;
