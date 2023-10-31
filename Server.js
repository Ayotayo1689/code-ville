const express = require("express");
const app = express();
require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const { config, utils } = cloudinary;

const admin = require("firebase-admin");
const credentials = require("./key.json");
// const cloudinary = require('cloudinary').v2;

const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
const fs = require('fs')


var cors = require('cors')





admin.initializeApp({
    credential: admin.credential.cert(credentials)
});



const db = admin.firestore();

app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.use(cors())


// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });


// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Create the upload directory if it doesn't exist
//     if (!fs.existsSync('uploads')) {
//       fs.mkdirSync('uploads');
//     }

//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

const storage = multer.memoryStorage();
const upload = multer({ storage });





function getUserFromDatabase(userId) {
  const usersRef = admin.firestore().collection('users');
  const userRef = usersRef.doc(userId);

  return userRef.get()
    .then((doc) => {
      if (doc.exists) {
        return doc.data();
      }
      return null;
    })
    .catch((error) => {
      console.error('Error fetching user data:', error);
      throw error;
    });
}

// Authentication middleware using user IDs as tokens
// app.use((req, res, next) => {
//   const token = req.headers.authorization;

//   if (!token) {
//     return res.status(401).send('Unauthorized');
//   }

//   const userId = token;
//   const user = getUserFromDatabase(userId);

//   if (user === null) {
//     return res.status(401).send('Unauthorized');
//   }

//   req.user = user;
//   next();
// });




const isAdmin = (req, res, next) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
  
    const userId = token;
    const user = getUserFromDatabase(userId);

    console.log(user);
  
    if (user === null) {
      return res.status(401).send('Unauthorized');
    }

  
    req.user = user;
    next();
  }





// // Middleware to verify if a user is an admin
// const isAdmin = (req, res, next) => {
//   const user = req.data;

//   if (user === null) {
//     return res.status(401).send('User not found.');
//   }

//   if (user.isAdmin === true) {
//     next(); // User is an admin, allow access
//   } else {
//     res.status(403).send(user);
//   }
// };




app.get('/',(req, res) => {
    res.status(201).json({
        message: 'welcome to bitstock api '
    })
})






// const collectionRef = db.collection('users');

// // Delete all documents in the collection
// collectionRef.listDocuments().then((documents) => {
//   documents.forEach((doc) => {
//     doc.delete().then(() => {
//       console.log(`Document ${doc.id} deleted successfully.`);
//     }).catch((error) => {
//       console.error(`Error deleting document ${doc.id}: ${error}`);
//     });
//   });
// }).catch((error) => {
//   console.error(`Error listing documents: ${error}`);
// });

















//create account
app.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNo, password, department } = req.body;
    const usersRef = admin.firestore().collection('users');
    const newUser = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNo: phoneNo,
      isAdmin: false,
      profilePic:"",
      password: password,
      department: department,
      tasks: [] ,
    };
    const docRef = await usersRef.add(newUser);
    res.status(201).json({
      id: docRef.id,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});


app.put('/users/:userId/profile_pic', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePic } = req.body;

    const userRef = admin.firestore().collection('users').doc(userId);

    await userRef.update({ profilePic });

    res.status(200).json({
      message: 'picture updated successfully',
    });
  } catch (error) {
    console.error('Error updating user picture:', error);
    res.status(500).json({ error: 'Failed to update user picture', msg: error });
  }
});


// Create an API endpoint to add a task for a specific user
app.post('/users/:userId/add-task', async (req, res) => {
  try {
    const { description, dueDate } = req.body;
    const userId = req.params.userId; // Get the user ID from the URL parameter

    // Generate a unique task ID
    const taskId = `${userId}_${Date.now()}`;

    // Fetch user data to get the assigneeName
    const usersRef = admin.firestore().collection('users');
    const userRef = usersRef.doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    // qyae4LMuZRDWIkvFv9hA_1698069562305 

    // Create a new task with a unique ID and assigneeName derived from user data
    const newTask = {
      taskId,
      assigneeName: userData.firstName,
      assigneeID: userId,
      description,
      assignedAt: new Date().toString(),
      dueDate,
      state: "open",
      department: userData.department,
    };

    await userRef.update({
      tasks: admin.firestore.FieldValue.arrayUnion(newTask),
    });

    res.status(201).json({ message: 'Task added successfully', data: newTask });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});





// app.post('/users/:userId/add-task', upload.single('taskImage'), async (req, res) => {
//   try {
//     const { description, dueDate } = req.body;
//     const userId = req.params.userId;
//     const taskId = `${userId}_${Date.now()}`;

//     // Fetch user data to get the assigneeName
//     const usersRef = admin.firestore().collection('users');
//     const userRef = usersRef.doc(userId);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const userData = userDoc.data();

    // const newTask = {
    //   taskId,
    //   assigneeName: userData.firstName,
    //   assigneeID: userId,
    //   description,
    //   assignedAt: new Date().toString(),
    //   dueDate,
    //   state: 'open',
    //   department: userData.department,
    // };

//     // If an image was uploaded, upload it to Cloudinary
//     if (req.file) {
//       const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path);

//       // Add the Cloudinary image URL and other details to the task
//       newTask.taskImage = {
//         url: cloudinaryUpload.secure_url,
//         publicId: cloudinaryUpload.public_id,
//         originalname: req.file.originalname,
//         filename: req.file.filename,
//         path: req.file.path,
//       };
//     }

//     await userRef.update({
//       tasks: admin.firestore.FieldValue.arrayUnion(newTask),
//     });

//     res.status(201).json({ message: 'Task added successfully', data: newTask });
//   } catch (error) {
//     console.error('Error adding task:', error);
//     res.status(500).json({ error: 'Failed to add task' });
//   }
// });  
const signUpload = async () => {
  const timestamp = Math.round(new Date() / 1000); // Fix the typo in 'new Date()'
  const params = {
    timestamp: timestamp,
  };
  const signature = await cloudinary.utils.api_sign_request(params,"916184952314884","Nb-AINTtJsIfj9XeG6ICDiA1VYo_gY");
  console.log(signature);
  return { timestamp, signature };
};

// console.log(cloudinary.config());

// const { timestamp, signature } = await signUpload();
// cloudinary.uploader.upload("./uploads/1698187995215-codeville-black.png", {resource_type: "image"}).then((result)=>{
//   console.log("sucess", JSON.stringify(result, null, 2));
// }).catch((error)=>{
//   console.log("error", JSON.stringify(error, null, 2));
// })




// app.post('/users/:userId/add-task', upload.single('taskImage'), async (req, res) => {
//   try {
//     const { description, dueDate } = req.body;
//     const userId = req.params.userId;
//     const taskId = `${userId}_${Date.now()}`;

//     // Fetch user data to get the assigneeName (Replace with your Firestore code)
//     // const userData = await fetchUserData(userId);

//     const userData = { firstName: 'John', department: 'IT' }; // Sample user data

//     const newTask = {
//       taskId,
//       assigneeName: userData.firstName,
//       assigneeID: userId,
//       description,
//       assignedAt: new Date().toString(),
//       dueDate,
//       state: 'open',
//       department: userData.department,
//     };

//     // If an image was uploaded, upload it to Cloudinary
//     if (req.file) {
//       const { timestamp, signature } = await signUpload();
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: 'tasks', // Optional folder for organizing images
//         timestamp: timestamp,
//         signature: signature,
//       });

//       newTask.taskImage = {
//         url: result.secure_url,
//         publicId: result.public_id,
//         format: result.format,
//       };
//     }

//     // Store the new task (Replace with your Firestore code)
//     // await storeNewTask(userId, newTask);

//     res.status(201).json({ message: 'Task added successfully', data: newTask });
//   } catch (error) {
//     console.error('Error adding task:', error);
//     res.status(500).json({ error: 'Failed to add task' });
//   }
// })

























app.delete('/users/:userId/delete-task/:taskId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const taskId = parseInt(req.params.taskId, 10); 

  
    const usersRef = admin.firestore().collection('users');
    const userRef = usersRef.doc(userId);

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    const tasks = user.tasks.filter((task, index) => index !== taskId);

    await userRef.update({ tasks });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});







app.put('/users/:userId/update-task-state/:taskId', async (req, res) => {
  try {
    const { state } = req.body;
    const userId = req.params.userId;
    const taskId = req.params.taskId;

    const usersRef = admin.firestore().collection('users');
    const userRef = usersRef.doc(userId);

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    const updatedTasks = user.tasks.map((task, index) => {
      if (task.taskId === taskId) {
        return { ...task, state }; 
      }
      return task; 
    });


    await userRef.update({ tasks: updatedTasks });

    res.status(200).json({ message: 'Task state updated successfully', updatedTasks });
  } catch (error) {
    console.error('Error updating task state:', error);
    res.status(500).json({ error: 'Failed to update task state' });
  }
}); 












// Route to promote a user to admin (requires isAdmin middleware)
app.post('/users/promote-to-admin/:userId', isAdmin, async (req, res) => {
  const userId = req.params.userId;

  try {
    const userRecord = await admin.auth().getUser(userId);

    if (userRecord.customClaims && userRecord.customClaims.isAdmin) {
      return res.status(200).json({ message: 'User is already an admin' });
    }

    await admin.auth().setCustomUserClaims(userId, { isAdmin: true });

    res.status(200).json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
});







//get all users
app.get('/users', async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users');
    const querySnapshot = await usersRef.get();

    if (querySnapshot.empty) {
      // No users found
      return res.status(404).json({ error: 'No users found' });
    }

    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id; // Get the document ID
      const userWithId = { id: userId, ...userData }; // Include the ID in the user data
      users.push(userWithId);
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});


//get user by Id
app.get('/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const usersRef = admin.firestore().collection('users');
      const userDoc = await usersRef.doc(userId).get();
  
      if (!userDoc.exists) {
        // User with the given ID doesn't exist
        return res.status(404).json({ error: 'User not found' });
      }
  
      const userData = userDoc.data();
      res.status(200).json({
        id: userDoc.id,
        data: userData
      });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  });
  



//login user

app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const usersRef = admin.firestore().collection('users');
      const querySnapshot = await usersRef.where('email', '==', email).get();
      
      if (querySnapshot.empty) {
        // User with the given email doesn't exist
        return res.status(404).json({ error: 'email does not exist' });
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (userData.password !== password) {
        // Incorrect password
        return res.status(401).json({ error: 'Incorrect password' });
      }
      
      res.status(200).json({
        message: 'Login successful',
       data:{
        id: userDoc.id,
        firstName: userDoc._fieldsProto.firstName.stringValue,
        lastName: userDoc._fieldsProto.lastName.stringValue,
        email: userDoc._fieldsProto.email.stringValue,
        phoneNo: userDoc._fieldsProto.phoneNo.stringValue,
        isAdmin: userDoc._fieldsProto.isAdmin.booleanValue,
        department: userDoc._fieldsProto.department.stringValue,
        tasks: userDoc._fieldsProto.tasks.arrayValue.values,
       }
       
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });
  

  app.get('/tasks', async (req, res) => {
    try {
      const usersRef = admin.firestore().collection('users');
      const usersSnapshot = await usersRef.get();
  
      const allTasks = [];
  
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.tasks && Array.isArray(userData.tasks)) {
          allTasks.push(...userData.tasks);
        }
      });
  
      res.status(200).json(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });
  




  
      










const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=>{
    console.log(`server is running on PORT ${PORT}...`)
})
