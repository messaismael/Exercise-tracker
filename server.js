const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI, {useNewUrlParser: true, useUnifiedTopology: true} || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json())

let Schema = mongoose.Schema;
let userSchema = new Schema({
  name: {type:String, required: true},
  description: String,
  duration: Number,
  date: String 
})

let days = ["Month", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let User =  mongoose.model('User', userSchema);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//create a new user
app.post("/api/exercise/new-user", async function(req, res){
  
  let username = req.body.username;
  
  let r = await User.findOne({name: username}).select("-__v");
  
  if(!r){
    let n = new User({
      name: username
    })
    await n.save();
    
    let v = await User.findOne({name: username}).select("-__v");
    res.json(v);
  }
  else {
    res.send("username already exist.");
  }
})


// add exercises
 
app.post("/api/exercise/add", async function(req, res){
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  
  let id = await User.findById({_id: userId}).select('-__v');
  
  if(!id){
    res.send('unknown _id');
  }else {
    // verified description
    if(!description){
      res.send("Path `description` is required.");
    }
    else if(description.length >=20){
      res.send("Your description is too long.");
    }
    else{
      id.description = description;
      await id.save();
    }
    // virified duration
    if(!duration){
       res.send('Path `duration` is required.');
    }
    else{
      id.duration = duration;
      await id.save();  
   }
    //verified date
    if(date===""){
    
    id.date = Date().toString().split(" ").slice(0,4).join(" ");
    await id.save();
    }
    else if ( isNaN(Number(date)) ){
      if(new Date(date).toString() === "Invalid Date"){
        res.send('Cast to Date failed for value '+' "'+date+'" '+' at path "date"');
      } 
      else {
        id.date = new Date(date).toString().split(" ").slice(0,4).join(" ");
        await id.save();
      }  
    }else{
      id.date = new Date(parseInt(date)).toString().split(" ").slice(0,4).join(" "); 
      await id.save();
    }
    
    
   res.json(id);
    
  }
})

 
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
}) 


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

