const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const serviceAccount = require("./config/creds.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const database = admin.firestore();
const app = express();
app.use(cors());

const userMapping = (doc) => {
  const { name, description, picture, votes, category } = doc.data();
  const totalVotes = votes.negative + votes.positive;
  const percentagePositive = parseFloat(
    ((votes.positive * 100) / totalVotes).toFixed(2)
  );
  const percentageNegative = parseFloat(
    ((votes.negative * 100) / totalVotes).toFixed(2)
  );
  return {
    id: doc.id,
    name,
    description,
    category,
    picture,
    votes: {
      ...votes,
      total: totalVotes,
      percentagePositive,
      percentageNegative,
    },
  };
};

app.get("/users", async (_, res) => {
  const query = await database.collection("users").get();
  const data = query.docs.map(userMapping);
  res.status(200).json(data);
});

app.put("/users/:id/vote", async (req, res) => {
  const { id } = req.params;
  const { votes } = req.body;
  const document = database.collection("users").doc(id);
  await document.update({
    votes,
  });
  const docUpdated = (await document.get()).data();
  res.status(200).json(docUpdated);
});

exports.api = functions.https.onRequest(app);
