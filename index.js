const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


async function run() {
  // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
  mongoose.connect(process.env.MONGO_URI);
  //await mongoose.connection.db.admin().command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}
run().catch(console.dir);



const { Schema } = mongoose;

//Creates the User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);


//Creates the Exercise Schema 
const exerciseSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref:'User', required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


app.post('/api/users', async(req, res) => {
  try{
    const { username } = req.body;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
     res.status(500).json({ error: 'Failed to create user', message: err.message });
    }
    });
    

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users', message: err.message });
  }
});




app.post('/api/users/:_id/exercises', async(req, res) => {
  try{
    const userId = req.params._id;
    const {description, duration, date} = req.body;

    const exercise = new Exercise({
      userId,
      description,
      duration,
      date: date ? new Date(date) : undefined
    });

    await exercise.save();
    
    const user = await User.findById(userId);

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create exercise', message: err.message });
  }
});


app.get('/api/users/:_id/logs', async(req, res) => {
  try{
    const userId = req.params._id;
    const {from, to, limit} = req.query;

    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();
    const limitNum = limit || 0;
    //const countUserDocs = userExercises.length()
     
    const user = await User.findById(userId)
    const userExercises = await Exercise.find({
      userId : user, date: {$gte: fromDate, $lte: toDate}
    })
    .sort({ date: -1 })
    .limit(limitNum)
    .exec();

    const log = userExercises.map(userExercise => ({
      description: userExercise.description,
      duration: userExercise.duration,
      date: userExercise.date.toDateString()
     }));

    res.json({
        username: user.username,
        count: log.length,
        _id: user._id,
        log: log
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to find user exercise logs', message: err.message });
   }
 });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
