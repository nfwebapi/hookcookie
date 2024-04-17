// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Middleware to parse JSON bodies
app.use(express.json());

// Store incoming requests temporarily
const requests = {};

// Function to generate a unique ID
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 8); // For simplicity, using a random string
}

// Define a route to generate unique URLs
app.get('/webhook', (req, res) => {
  // Generate a unique ID
  const uniqueId = generateUniqueId();

  // Send the unique URL as the response
  res.send({ url: `http://localhost:3000/webhook/${uniqueId}` });
});

// Define a route to handle incoming webhook requests
app.post('/webhook/:id', (req, res) => {
  // Store the incoming request data
  const requestId = req.params.id;
  const requestData = req.body; // Parse request body

  // Assign a unique ID to the request data
  requestData.id = generateUniqueId();

  // Check if the requests object is initialized for the unique ID
  if (!requests[requestId]) {
    requests[requestId] = [];
  }

  requests[requestId].push(requestData);

  // Emit the updated requests data to the socket associated with the webhook ID
  io.to(requestId).emit('requestsUpdated', { id: requestId, requests: requests[requestId] });

  // Send a success response
  res.status(200).send('Webhook received successfully!');
});

// Define a route to handle deleting specific request logs based on their unique ID
app.delete('/webhook/:id/:requestId', (req, res) => {
  const requestId = req.params.id;
  const requestIdToDelete = req.params.requestId;

  // Check if the requests object is initialized for the unique ID
  if (requests[requestId]) {
    // Find the index of the request log with the matching unique ID
    const index = requests[requestId].findIndex(request => request.id === requestIdToDelete);
    if (index !== -1) {
      // Delete the request log
      requests[requestId].splice(index, 1);

      // Emit the updated requests data to the socket associated with the webhook ID
      io.to(requestId).emit('requestsUpdated', { id: requestId, requests: requests[requestId] });

      return res.status(200).send('Request log deleted successfully!');
    } else {
      return res.status(404).send('Request log not found');
    }
  } else {
    return res.status(404).send('Requests not found');
  }
});

// Define a route to handle accessing JSON data for a specific request ID
app.get('/webhook/:id/read/:requestId', (req, res) => {
  const requestId = req.params.requestId;
  const webhookId = req.params.id;

  // Check if the requests object is initialized for the unique ID
  if (requests[webhookId]) {
    // Find the request log with the matching unique ID
    const requestLog = requests[webhookId].find(request => request.id === requestId);
    if (requestLog) {
      // Return the JSON data for the specific request
      res.json(requestLog);
    } else {
      // Request log not found
      res.status(404).send('Request log not found');
    }
  } else {
    // Requests not found for the specified webhook ID
    res.status(404).send('Requests not found');
  }
});

// Define route to serve HTML page for displaying incoming requests
app.get('/webhook/:id', (req, res) => {
  // Read the HTML file dynamically
  const htmlFilePath = `${__dirname}/public/webhook.html`;
  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading HTML file:', err);
      return res.status(500).send('Error serving HTML file');
    }

    // Replace the placeholder with the actual webhook ID
    const modifiedHtml = data.replace('{{WEBHOOK_ID}}', req.params.id);
    res.send(modifiedHtml);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    socket.emit('requestsUpdated', { id: roomId, requests: requests[roomId] || [] });
  });

  socket.on('loadInitialRequests', (id) => {
    socket.emit('requestsUpdated', { id, requests: requests[id] || [] });
  });
});
