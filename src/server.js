/* eslint-disable no-process-exit */
/* eslint-disable no-console */

// handle uncaught exceptions
process.on('uncaughtException', (err) => {
	if (process.env.NODE_ENV === 'development') console.log(err);

	console.log(`\nUncaught Exception occurred\n${err.name}: ${err.message}`);
	process.exit(1);
});

// 3rd party modules
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
PostModel = require('./PostModel.js')
const express = require('express');
const cors = require('cors');

// import PostModel from './PostModel.js';


// configure environment variables
dotenv.config({ path: `${__dirname}/../config.env` });

// custom modules
// const app = require('./app');
const app = express();

app.use(express.json())
app.use(cors());

app.get("/", (req, res) => {
    res.send("hi everything is ok")
  });

// database source
let DB = process.env.DATABASE_LOCAL;
if (process.env.DATABASE_HOST === 'REMOTE') {
	DB = process.env.DATABASE_REMOTE;
	DB = DB.replace('<USERNAME>', process.env.DATABASE_USERNAME);
	DB = DB.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
}
DB = DB.replace('<DBNAME>', process.env.DATABASE_DBNAME);

// connect to database
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		// useCreateIndex: true,
		// useFindAndModify: false,
	})
	.then(() => {
		console.log('Database connected.');
	})
	.catch((err) => {
		if (process.env.NODE_ENV === 'development') console.log(err);
		console.log('Database connection failed!');
	});


// start of the Blog solution 


const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	  cb(null, "../elearnbd-master/public/images/") // this directory is from public directory
	},
	filename: (req, file, cb) => {
	  cb(null, Date.now() + "-" + file.originalname)
	},
  })
  
  const uploadStorage = multer({ storage: storage })
  app.post("/posts", uploadStorage.single('file'),(req, res) =>{
	  console.log(req.body.file)
	const obj = {
	  avater:req.body.avater,
	  status:req.body.status,
	  UserName:req.body.UserName,
	  file:req.file.filename,
	  timestamp: new Date()
	}
	console.log(obj)
	if(obj){
	  PostModel.create(obj,(err,data) => {
		if(err){
		  res.status(500).send(err)
		  console.log(err)
		}
		else{
		  res.status(201).send(data)
		  console.log("created post")
		}
	  })
	}
  
  })
  app.get('/sync', (req, res) => {
	PostModel.find((err,data)=>{
		if(err){
			res.status(500).send(err)
		}
		else{
			res.status(201).send(data)
		}
	}).sort( { 'timestamp': -1 } )
  
  
  });
  app.post("/upload/single/update",
  async (req, res) => { 
   const postalId = req.body.id; 
   const comment = req.body.comments;
   const userProfile = req.body.userProfile;
   const displayName = req.body.displayName;
   try{
	 if(postalId){
	   let findPost = await PostModel.findById({
		_id:postalId
	   })
	   if(findPost){
		 console.log("post exist and we can use")
		 // console.log(findPost)
		 const commenting = {
		   userProfile:userProfile,
		   displayName:displayName,
		   comment:comment
		 } ;
		 await PostModel.findByIdAndUpdate({_id:postalId},{
		   $push: {
			   comments: commenting
		   }
	   });
		 res.send(commenting);
		 console.log(commenting);
	   }
	   else{
		 console.log("post does not exist")
	   }
	 }
	 else{
	   console.log("we did not find the id")
	 }
 
   } catch(e){
	 console.log(e)
 
   }
 })
//  likeAdd

app.post("/likeAdd",
async (req, res) => { 
 const postalId = req.body.id; 
 const react = req.body.react;
 const userProfile = req.body.userProfile;
 const displayName = req.body.displayName;
 try{
   if(postalId){
	 let findPost = await PostModel.findById({
	  _id:postalId
	 })
	 if(findPost){
	   console.log("post exist and we can use")
	   // console.log(findPost)
	   const reacting = {
		 userProfile:userProfile,
		 displayName:displayName,
		 comment:react
	   } ;
	   await PostModel.findByIdAndUpdate({_id:postalId},{
		 $push: {
			reacts: reacting
		 }
	 });
	   res.send(reacting);
	   console.log(reacting);
	 }
	 else{
	   console.log("post does not exist")
	 }
   }
   else{
	 console.log("we did not find the id")
   }

 } catch(e){
   console.log(e)

 }
})






// end of the Blog solution 




// Start server
// NODE_ENV=production nodemon "src/server.js"
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	if (process.env.NODE_ENV === 'development') {
		console.log(`Developmet server is running on port ${port}`);
	} else {
		console.log('Production server is running');
	}
});

// handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
	if (process.env.NODE_ENV === 'development') console.log(err);

	console.log(`\nUnhandled Rejection occurred\n${err.name}: ${err.message}`);
	server.close(() => {
		process.exit(1);
	});
});

// Heroku server SIGTERM shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM RECEIVED. Shutting down gracefully');
	server.close(() => {
		console.log('Process terminated.');
	});
});
