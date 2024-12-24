const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

require('dotenv').config();
const port = process.env.PORT || 5000
const app = express()



app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())

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


const verify =(req,res,next)=>{
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).send({message:"unauthorize access"})
  }
  // verify token
  jwt.verify(token,  process.env.SECRET_KEY, function(err, decoded) {
    if (err) {
      return res.status(401).send({message:"unauthorize access"})
    }
    req.user=decoded
  });
  next()
}

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
// console.log( process.env.DB_USER)
// console.log('line 46==>', process.env.SECRET_KEY)
// !jwt
app.post('/jwt',(req,res)=>{
  const user =req.body
  var token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn:"365d"});
  res.cookie("token",token,{
    httpOnly: true,
    secure:false,
    // sameSite:
  }).send({success:true})
})

app.post('/logOut',(req,res)=>{
  res.clearCookie('token',{
    maxAge: 0,
    httpOnly:true,
    secure:false
  }).send({success:true})
})



// *recommendation
/* --------------------------- get recommendations -------------------------- */
app.get('/recommendations/:queryId',async (req,res)=>{
  const id = req.params.queryId
  const query = {queryId:id}
  const result = await recommendCollection.find(query).toArray();
  // console.log("line 54", result)
  res.send(result)
})

/* ------------------------------- my recommendations ------------------------------- */
app.get('/myRecommends/:email',async (req,res)=>{
  const email = req.params.email
  
  const query = {recommenderEmail:email}
    const result = await recommendCollection.find(query).sort({currentTime:-1}).toArray();
   
    res.send(result)
})

/* ------------------------------ added recommendations data on db ----------------------------- */
app.post('/add-recommendation',async(req,res)=>{
  const recommendData = req.body
  const result = await recommendCollection.insertOne(recommendData);
  /* ------------------------------ increase data ----------------------------- */
  const filter ={_id:new ObjectId(recommendData.queryId)}
  const update = {
    $inc:{recommendationCount:1}
  }
  const count = await queryCollection.updateOne(filter,update);
  res.send(result)
})
/* ------------------------------ delete recommendations ------------------------------ */
app.put('/recommend/:id',async(req,res)=>{
  const id = req.params.id
  const recommendData = req.body
  console.log('line 78',recommendData)

  const query = {_id:new ObjectId(id)}
  const result = await recommendCollection.deleteOne(query);
 

   /* ------------------------------ increase data ----------------------------- */
   const filter ={_id:new ObjectId(recommendData.queryId)}
   console.log("line 85",filter)
   const update = {
     $inc:{recommendationCount:-1}
   }
   const count = await queryCollection.updateOne(filter,update);
   console.log(count)
 

  res.send(result)
})

/* -------------------------- recommendation for me -------------------------- */

app.get('/myRecommendations/:email',async (req,res)=>{
  const email = req.params.email
  const query = {queryUserEmail:email}
  // console.log(email)
  // const currentTime = parseInt(currentTime)
    const result = await recommendCollection.find(query).sort({currentTime:-1}).toArray();
    // console.log("line 57", result)
    res.send(result)
})





// *query
/* ----------------------------- recent queries ----------------------------- */
app.get('/recentQueries',async (req,res)=>{
    const result = await queryCollection.find().sort({currentTime:-1}).limit(6).toArray();
    // console.log("line 54", result)
    res.send(result)
})
/* ------------------------------- all queries ------------------------------ */
app.get('/allQueries',async (req,res)=>{
  const search = req.query.search
  // console.log(search)

  let query = {}
  if (search) {
    query = {productName:{$regex:search,$options:"i"}}
  }
    const result = await queryCollection.find(query).sort({currentTime:-1}).toArray();
    // console.log("line 54", result)
    res.send(result)
})
/* ------------------------------- my queries ------------------------------- */
app.get('/myQueries/:email', verify,async(req,res)=>{
  const email = req.params.email
  const query = {email:email}
  console.log(req.cookies)
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
    // console.log("line 71", result)
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
