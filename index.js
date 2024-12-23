const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000
const app = express()

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ot76b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017/"

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    /* --------------------- create database with collection --------------------- */
    const queryCollection = client.db("queryDB").collection("queries");
    const recommendCollection = client.db("queryDB").collection("recommends");

/* ----------------------------- write code here ---------------------------- */



/* ----------------------------- recent queries ----------------------------- */
app.get('/recentQueries',async (req,res)=>{
    const result = await queryCollection.find().sort({currentTime:-1}).limit(6).toArray();
    // console.log("line 54", result)
    res.send(result)
})
/* ------------------------------- all queries ------------------------------ */
app.get('/allQueries',async (req,res)=>{
    const result = await queryCollection.find().sort({currentTime:-1}).toArray();
    // console.log("line 54", result)
    res.send(result)
})
/* ------------------------------- my queries ------------------------------- */
app.get('/myQueries/:email',async (req,res)=>{
  const email = req.params.email
  const query = {email:email}
  // console.log(email)
  // const currentTime = parseInt(currentTime)
    const result = await queryCollection.find(query).sort({currentTime:-1}).toArray();
    // console.log("line 57", result)
    res.send(result)
})

/* ------------------------------ query details ----------------------------- */
app.get('/allQueries/:id',async (req,res)=>{
  const id = req.params.id
  
  const query = {_id:new ObjectId(id)}
 
    const result = await queryCollection.findOne(query);
    console.log("line 71", result)
    res.send(result)
})

/* ------------------------------ added query data on db ----------------------------- */
app.post('/add-queries',async(req,res)=>{
  const data = req.body
  // console.log(data)
  const result = await queryCollection.insertOne(data);
  res.send(result)
})

/* ------------------------------ delete query ------------------------------ */
app.delete('/query/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id:new ObjectId(id)}
  // console.log("line 86", query)
  const result = await queryCollection.deleteOne(query);
  // console.log("line 88", result)
  res.send(result)
})
/* ------------------------------ update quay ------------------------------ */
app.put('/updateQuery/:id',async(req,res)=>{
  const id = req.params.id
  const filter = {_id:new ObjectId(id)}
  const updateDoc = {
    $set: req.body,
  };
  const options = { upsert: true };
  const result = await queryCollection.updateOne(filter,updateDoc,options);
  console.log("line 96", result)
  res.send(result)
})

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.get('/',(req,res)=>{
    res.send(`i am running`)
})
app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})
run().catch(console.dir);
