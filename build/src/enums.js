"use strict";
/*!
 * Copyright 2019, OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var AttributeNames;
(function (AttributeNames) {
    // required by https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/data-semantic-conventions.md#databases-client-calls
    AttributeNames["COMPONENT"] = "component";
    AttributeNames["DB_TYPE"] = "db.type";
    AttributeNames["DB_INSTANCE"] = "db.instance";
    AttributeNames["DB_STATEMENT"] = "db.statement";
    AttributeNames["PEER_ADDRESS"] = "peer.address";
    AttributeNames["PEER_HOSTNAME"] = "peer.host";
    AttributeNames["ORBIT_ID"] = "orbitdb.id";
    AttributeNames["ORBIT_ADDRESS"] = "orbitdb.address";
    AttributeNames["IPFS_VERSION"] = "ipfs.version";
    // optional
    AttributeNames["DB_USER"] = "db.user";
    AttributeNames["PEER_PORT"] = "peer.port";
    AttributeNames["PEER_IPV4"] = "peer.ipv4";
    AttributeNames["PEER_IPV6"] = "peer.ipv6";
    AttributeNames["PEER_SERVICE"] = "peer.service";
})(AttributeNames = exports.AttributeNames || (exports.AttributeNames = {}));
//# sourceMappingURL=enums.js.map