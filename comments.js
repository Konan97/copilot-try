// Create web server
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

// Get all comments for a post
const getComments = (postId) => {
  return posts[postId] || [];
};

// Add a new comment
const addComment = (postId, comment) => {
  const comments = getComments(postId);
  comments.push(comment);
  posts[postId] = comments;
};

// Handle events from event-bus
app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log("Event received: ", type);

  if (type === "CommentCreated") {
    const { id, postId, content, status } = data;
    const comment = { id, postId, content, status };

    addComment(postId, comment);
  }

  if (type === "CommentUpdated") {
    const { id, postId, content, status } = data;
    const comments = getComments(postId);
    const comment = comments.find((c) => c.id === id);
    comment.status = status;
    comment.content = content;
  }

  res.json({});
});

// Get all comments for a post
app.get("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  res.json(getComments(id));
});

// Create a new comment for a post
app.post("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  // Create a new comment
  const comment = { id: Math.random().toString(36).substr(2, 7), content, status: "pending" };
  addComment(id, comment);

  // Emit event
  await axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: { ...comment, postId: id },
  });

  res.status(201).json(comment);
});

app.listen(4001, () => console.log("Comments service running on port 4001"));