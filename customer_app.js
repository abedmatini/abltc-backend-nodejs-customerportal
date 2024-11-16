// Importing necessary libraries and modules
const mongoose = require('mongoose');            // MongoDB ODM library
const Customers = require('./customer');         // Imported MongoDB model for 'customers'
const express = require('express');              // Express.js web framework
const bodyParser = require('body-parser');       // Middleware for parsing JSON requests
const path = require('path');                    // Node.js path module for working with file and directory paths
const bcrypt = require('bcrypt');
const saltRounds = 5;
const password = "admin";
const session = require('express-session');const { ValidationError, InvalidUserError, AuthenticationFailed } = require('./errors/CustomError');


// Creating an instance of the Express application
const app = express();

const uuid = require('uuid'); //to generate a unique session id

app.use(session({
      cookie: { maxAge: 120000 }, // Session expires after 2 minutes of inactivity
    secret: 'itsmysecret',
    res: false,
    saveUninitialized: true,
    genid: () => uuid.v4()
}));

// Setting the port number for the server
const port = 3000;

app.use((err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "Error";
    console.log(err.stack);
    res.status(err.statusCode).json({
        status: err.statusCode,
        message: err.message,
    });
})

app.all("*",(req,res,next)=>{
    const err = new Error(`Cannot find the URL ${req.originalUrl} in this application. Please check.`);
    err.status = "Endpoint Failure";
    err.statusCode = 404.
    next(err);
})

// MongoDB connection URI and database name
const uri =  "mongodb://localhost:27017";
mongoose.connect(uri, {'dbName': 'customerDB'});

// Middleware to parse JSON requests
app.use("*", bodyParser.json());

// Serving static files from the 'frontend' directory under the '/static' route
app.use('/static', express.static(path.join(".", 'frontend')));

// Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// POST endpoint for user login
// app.post('/api/login', async (req, res) => {
//     const data = req.body;
//     console.log(data);

//     let user_name = data['user_name'];
//     let password = data['password'];

//     // Querying the MongoDB 'customers' collection for matching user_name and password
//     const documents = await Customers.find({ user_name: user_name });

//     // If a matching user is found, set the session username and serve the home page
//     if (documents.length > 0) {
//         let result = await bcrypt.compare(password, documents[0]['password'])
//         if(true) {
//             const genidValue = req.sessionID;
//             res.cookie('username', user_name);
//             res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
//         } else {
//             res.send("Password Incorrect! Try again");
//         }
//     } else {
//         res.send("User Information incorrect");
//     }
// });

// POST endpoint for user login
app.post('/api/login', async (req, res, next) => {
    const data = req.body;
    const user_name = data['user_name'];
    const password = data['password'];
 
    try {
        const user = await Customers.findOne({ user_name: user_name });
        if (!user) {
            throw new InvalidUserError("No such user in database");
        }
        if (user.password !== password) {
            throw new AuthenticationFailed("Passwords don't match");
        }
        res.send("User Logged In");
    } catch (error) {
        next(error);
    }
});

// POST endpoint for adding a new customer
// app.post('/api/add_customer', async (req, res) => {
//     const data = req.body;

//     const documents = await Customers.find({ user_name: data['user_name']});
//     if (documents.length > 0) {
//         res.send("User already exists");
//     }

//     let hashedpwd = bcrypt.hashSync(data['password'], saltRounds)

//     // Creating a new instance of the Customers model with data from the request
//     const customer = new Customers({
//         "user_name": data['user_name'],
//         "age": data['age'],
//         "password": hashedpwd,
//         "email": data['email']
//     });

//     // Saving the new customer to the MongoDB 'customers' collection
//     await customer.save();

//     res.send("Customer added successfully")
// });

// POST endpoint for adding a new customer
app.post('/api/add_customer', async (req, res, next) => {
    const data = req.body;
    const age = parseInt(data['age']);
 
    try {
        if (age < 21) {
            throw new ValidationError("Customer Under required age limit");
        }
 
        const customer = new Customers({
            "user_name": data['user_name'],
            "age": age,
            "password": data['password'],
            "email": data['email']
        });
 
        await customer.save();
 
        res.send("Customer added successfully");
    } catch (error) {
        next(error);
    }
});

// GET endpoint for user logout
// app.get('/api/logout', async (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//           console.error(err);
//         } else {
//           res.cookie('username', '', { expires: new Date(0) });
//           res.redirect('/');
//         }
//       });
// });
// GET endpoint for user logout
app.get('/api/logout', async (req, res) => {
    res.cookie('username', '', { expires: new Date(0) });
    res.redirect('/');
});

// GET endpoint for the root URL, serving the home page
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

// Starting the server and listening on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
