/**
 * @license
 * 
 * Copyright 2019 Google LLC
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
 * @fileoverview Node.js HTTP server for realtime collaboration.
 * @author navil@google.com (Navil Perez)
 */

const socket = require('socket.io');
const http = require('http');

const EventsHandlers = require('./websocket/events_handlers');
const UsersHandlers = require('./websocket/users_handlers');

const WS_PORT = 3001;
const Rooms = {};

const server = http.createServer(function(request, response) {
  response.writeHead(404);
  response.end();
});

server.listen(WS_PORT, function() {
  console.log('server start at port 3001');
});

io = socket(server);
io.on('connection', (user) => {
  onConnect_(user);
});

/**
 * Handler for listening to and emitting messages between the server and
 * connected users.
 * @param {!Object} user The user connecting.
 * @private
 */
async function onConnect_(user) {
  user.on('connectUser', async (workspaceId, rid = null, callback) => {
    if (rid != null && rid != undefined) {
        if (!isRoomExists(rid)) {
          createRoom(rid);
        }
        addUserToRoom(user, rid);
    } else {
      console.log(`no room id provided`);
    }
    await UsersHandlers.connectUserHandler(user, workspaceId, rid, callback);
  });

  user.on('disconnect', async () => {
    await UsersHandlers.disconnectUserHandler(user.workspaceId, () => {
      if (getUserRoom(user) != null) {
        removeUserFromRoom(user, getUserRoom(user));
      }
      io.emit('disconnectUser', user.workspaceId);
    });
  });

  user.on('addEvents', async (entry, rid = null, callback) => {
    await EventsHandlers.addEventsHandler(entry, rid, (serverId) => {
      entry.serverId = serverId;
      io.emit('broadcastEvents', rid, [entry]);
      callback(serverId);
    });
  });

  user.on('getEvents', async (serverId, rid = null, callback) => {
    console.log(`getEvents: ${rid}`);
    await EventsHandlers.getEventsHandler(serverId, rid, callback);
  });

  user.on('sendPositionUpdate', async (positionUpdate, rid = null, callback) => {
    await UsersHandlers.updatePositionHandler(user, positionUpdate, rid, callback);
  });

  user.on('getPositionUpdates', async (workspaceId, rid = null,  callback) => {
    await UsersHandlers.getPositionUpdatesHandler(workspaceId, rid, callback);
  });

  user.on('getSnapshot', async (rid = null, callback) => {
    await EventsHandlers.getSnapshotHandler(rid, callback);
  });
};

// Room management
const rooms = {};
function createRoom(roomName) {
    if (rooms[roomName]) {
        return false;
    }
    rooms[roomName] = {
        roomName: roomName,
        users: [],
    };
    return true;
}

function isRoomExists(roomName) {
    return rooms[roomName] ? true : false;
}

function addUserToRoom(user, roomName) {
    if (!isRoomExists(roomName)) {
        return false;
    }
    rooms[roomName].users.push(user);

    console.log(`${user.id} connected to room ${roomName}`);
    return true;
}

function removeUserFromRoom(user, roomName) {
    if (!isRoomExists(roomName)) {
        return false;
    }
    const index = rooms[roomName].users.indexOf(user);
    if (index > -1) {
        rooms[roomName].users.splice(index, 1);
    }
    console.log(`${user.id} disconnected from room ${roomName}`);
    return true;
}

function getUserRoom(user) {
    for (const room in rooms) {
        if (rooms[room].users.indexOf(user) > -1) {
            return room;
        }
    }
    return null;
}
