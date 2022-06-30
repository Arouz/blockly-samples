/**
 * @license
 * 
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Websocket middleware functions for interacting the with the
 * Events Table.
 * @author navil@google.com (Navil Perez)
 */

const database = require('../Database');

/**
 * Handler for a getEvents message. Query the database for events since the
 * last serverId.
 * @param {number} serverId serverId for the lower bound of the query.
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * receive acknowledgement of the success of the write.
 * @private
 */
async function getEventsHandler(serverId, rid = null, callback) {
  const entries = await database.query(serverId, rid);
  callback(entries);
};

/**
 * Handler for an addEvents message. Add an entry to the database.
 * @param {!LocalEntry} entry The entry to be added to the database.
 * @param {!Function} callback The callback passed in by the server to broadcast
 * the event.
 * @private
 */
async function addEventsHandler(entry, rid = null, callback) {
  const serverId = await database.addToServer(entry, rid);
  callback(serverId);
};

/**
 * Handler for a getSnapshot message. Get the latest snapshot of the workspace.
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * recieve the snapshot.
 * @public
 */
async function getSnapshotHandler(rid, callback) {
  console.log("getSnapshotHandler : " + rid);
  const snapshot = await database.getSnapshot(rid);
  callback(snapshot);
};

module.exports.getEventsHandler = getEventsHandler;
module.exports.addEventsHandler = addEventsHandler;
module.exports.getSnapshotHandler = getSnapshotHandler;
