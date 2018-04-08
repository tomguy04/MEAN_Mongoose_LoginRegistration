// Require the Express Module
var express = require('express');
// Create an Express App
var app = express();
//require session
var session = require('express-session');
//use session
app.use(session({secret: 'codingdojorocks'}));  // string for encryption
// Require body-parser (to receive post data from clients)
const validator = require('validator'); 
var mongoose = require('mongoose');
//require bcrypt
const bCrypt = require('bcrypt');
// This is how we connect to the mongodb database using mongoose -- "basic_mongoose" is the name of
//   our db in mongodb -- this should match the name of the db you are going to use for your project.
mongoose.connect('mongodb://localhost/LoginReg');
//Let's go ahead and make our first Schema that we will use to model Users. 
//Let's say that each user will have a name that is a string and an age that is a number. 
//The code to create a Schema is pretty simple as below
var UserSchema = new mongoose.Schema({ //Blueprint.  name and age in each document (row)
    email:{
        type: String, 
        required: true, 
        //minlength: [3, 'email is too short must at least 3 chars'],
        validate: { //custom validation
            validator( email ) { 
                return validator.isEmail(email);
            },
            message: 'not a valid email'
        },
        unique: true
    },
    first_name: {type: String, required: true, minlength:[1, 'first name is too short must at least 1 chars']},
    last_name: {type: String, required: true, minlength: 1},
    password: {type: String, required: true, minglength: 3},
    birthday: {type: Date, required: [true, 'birthday is required']}
}, { timestamps: true}
)

//hash the password before aka PRE saving in to the model instance.
UserSchema.pre('save', function(next) {
    if (!this.isModified('password')){
        return next();
    } 
    bCrypt.hash (this.password, 10)
    .then(hashed_pw => {
        console.log (`*******hashed ${this.password} as ${hashed_pw}`);
        this.password = hashed_pw;
        next();
    })
    .catch(
        //err => {console.log(`*****error while hashing pw`)}
        next
    );
})

//compare current pw w / hashed pw
UserSchema.statics.validatePW =  function(pw_from_form, storedHPW){
    //comparing PWs
    console.log('comparing PWs');
    return bCrypt.compare(pw_from_form, storedHPW);
}

//pre notes
// myModelSchema.pre('save', function(done){
//     this.name = this.addJayToString(this.name);
//     done();
//   });
  

//notes about bcrypt:
// bcrypt.hash('password_from_form', 10)
// .then(hashed_password => {
// })
// .catch(error => {
// });


mongoose.model('User',UserSchema); //we are settting this Schema in our Models as 'User. //User is the DB.  So you can do User.find{}
//Set the mongoose.model to the "User" variable so that we can run model-like methods on it to make all of the CRUD operations easier.
var User = mongoose.model('User'); //We are retrieving the Schema from out Models, named User. 

var bodyParser = require('body-parser');
// Integrate body-parser with our App
app.use(bodyParser.urlencoded({ extended: true }));
// Require path
var path = require('path');
// Setting our Static Folder Directory
app.use(express.static(path.join(__dirname, './static')));
// Use native promises
mongoose.Promise = global.Promise;
// Setting our Views Folder Directory
app.set('views', path.join(__dirname, './views'));
// Setting our View Engine set to EJS
app.set('view engine', 'ejs');
// Routes
// Root Request
app.get('/', function(req, res) {
    res.render('index');
})

// Add register Request 
app.post('/users', function(req, res) {
    console.log("POST DATA", req.body);
    // User.find({'email':req.body.email})
    // .then( user => {
    //     console.log(`found ${user}`)
    //     res.redirect('/');
    // })
    // .catch(()=>{

       //console.log(`***************************** ${arr.length}`);
       //res.redirect('/');

    if (req.body.password == req.body.password_confirm){
            User.create(req.body)
            .then(user => {
                console.log (`New user is ${user}`)
                res.redirect('/')
            })
            .catch(err => {
                console.log(`Error creating user ${err}`)
                res.redirect('/')
            })
        }
        else{
            console.log(`passwords don't match!`)
        }
        
    }
)
    

// user login
app.post('/users/login', function(request,response){
    console.log("POST DATA", request.body)
    User.findOne({'email': request.body.email})
    .then(userInfo => {
        if (!userInfo){
            //console.log('no such user');
            throw new Error();
        }
        console.log(`valid email ${request.body.email}`);
        bCrypt.compare(request.body.password, userInfo.password)
        .then((res)=> {
            if (res){
                console.log(`I can now log in the user ${res}`);
                if ('_id' in request.session){
                   
                    console.log(`_id is in session, ${request.session._id}`);
                    
                    //request.session.user = userInfo;
                    response.redirect("/welcome");   
                    //response.redirect('/');
                }
                else{
                    console.log(`_id is in NOT in session`);
                    request.session._id = userInfo._id;
                    //request.session.user = userInfo;
                    response.redirect("/welcome"); 
                    //response.redirect('/');
                }
   
                
            }
            else{
                console.log(`!!!Invalid email and password, I canNOT log the user in ${res}`);
                response.redirect('/');
                //response.render('index', {errorMsg: 'user and pw combo not valid'});
            }
        })
        // console.log(`sending ${req.body.password} and ${userInfo.password}`)
        // var temp=  User.validatePW(req.body.password, userInfo.password)
        // console.log (`ran validatePW and ---> ${temp}`);
        // res.redirect('/');
        // .then(()=> {
        //     console.log('valid email and password');
        // })
        
    })
    .catch((error)=>{
        console.log(`no such user ${error}` );
        response.redirect('/');
        //response.render('/', {errorMsg: 'that user does not exist})
    })
})

app.get('/welcome/', function(request,response){
    //const user = User.find(possibleUser => possibleUser._id === request.session._id)
    if ('_id' in request.session){
        console.log(`session at welcome route is ${request.session._id}`);
        User.findOne({'_id':request.session._id})
        
        .then(user => {
            console.log(JSON.stringify(user));
            response.render('welcome', {data:user})
        })
        

        .catch(()=>{console.log(`can't find user with that id`);})
    }
    else{response.redirect('/');}   
})

// Setting our Server to Listen on Port: 8000
app.listen(8000, function() {
    console.log("listening on port 8000");
})
