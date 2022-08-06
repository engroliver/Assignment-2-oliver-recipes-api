// require Express( yarn add express)
const express = require('express');
//require cors ( yarn add cors)
const cors = require('cors');
// ( yarn add dotenv)
require('dotenv').config();

// Jsonwebtoken( yarn add jsonwebtoken)
const jwt = require('jsonwebtoken');

// require MongoUtil ( yarn add mongodb)
const mongoUtil = require('./MongoUtil');
const { ObjectId } = require('mongodb');

//Express app
const app = express();

//Express use Json
app.use(express.json());

// cors 
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

function generateAccesToken(username,email){

    return jwt.sign({
        'username':username,
        'email':email
    },"Lk7Q5GZll66SY7YRBjhZUPwF1XnCMYhY",{
        'expiresIn':'1y'

    })
}


async function run() {

    // connect to mongodb
    const db = await mongoUtil.connect(MONGO_URI, DB_NAME);

    //route
    app.get('/', function (req, res) {

        res.json({

            'message': 'recipes'

        });


    })


    // Task 2: Create a Add Recipe Endpoint
    app.post('/recipes/add', async function (req, res) {
        await db.collection('recipes-api').insertOne({

            "title": req.body.title,
            "ingredients": req.body.ingredients,
            "prep_time": req.body.prep_time,
            "cook_time": req.body.cook_time,
            "total_time": req.body.total_time,
            "servings": req.body.servings,
            "cost": req.body.cost,



        })
        res.json({
            'message': 'Recipe Added'
        })

    })

    // Task 3 Create a Get all Recipes Endpoint /recipes & search by title
    app.get('/recipes', async function (req, res) {

        try{

            let criteria = {}

            if (req.query.title) {

                criteria.title = {
                    '$regex': req.query.title,
                    '$options': 'i'
                }
            }
            // get by cost
            if (req.query.cost) {
                criteria.cost = {
                    '$lte': parseInt(req.query.cost)
                }

            }
            // get recipe by ingredients
            if (req.query.ingredients) {

                criteria.ingredients = {
                    '$regex': req.query.ingredients,
                    '$options': 'i'
                }
            }
            console.log(criteria)

            const recipes = await db.collection('recipes-api').find(criteria, {

                'projection': {

                    'title': 1,
                    'ingredients': 1,
                    'prep_time': 1,
                    'cook_time': 1,
                    'total_time': 1,
                    'cost': 1
                }


            }).toArray();
            res.json(recipes);



        } catch (e){
            console.log(e)
            res.status(402);
            res.json({
                'error': e
            })
            
        }
        
    })

    // Task 4 Create a Update Recipe Endpoint The URL for the endpoint should be /recipes/<recipeId>
    app.put('/recipes/:recipeId', async function (req, res) {
        try {

            const recipes = await db.collection('recipes-api').findOne({
                '_id': ObjectId(req.params.recipeId)
            })

            const results = await db.collection('recipes-api').updateOne({
                '_id': ObjectId(req.params.recipeId)
            }, {
                "$set": {
                    'title': req.body.title ? req.body.title : recipes.title,
                    'ingredients': req.body.ingredients ? req.body.ingredients : recipes.ingredients,
                    'prep_time': req.body.prep_time ? req.body.prep_time : recipes.prep_time,
                    "cook_time": req.body.cook_time ? req.body.cook_time : recipes.cook_time,
                    "total_time": req.body.total_time ? req.body.total_time : recipes.total_time,
                    "servings": req.body.servings ? req.body.servings : recipes.servings,
                    "cost": req.body.cost ? req.body.cost : recipes.cost
                }
            })

            res.json({
                'message': 'data udpated successfully',
                'results': results
            })
        } catch (e) {
            console.log(e)
            res.status(500);
            res.json({
                'error': "Internal Server Error"
            })

        }


   

    })

    // Task 5: Create a Delete Recipe Endpoint /recipes/<recipeId>
    app.delete('/recipes/:recipeId', async function (req, res) {
        await db.collection('recipes-api').deleteOne({
            '_id': ObjectId(req.params.recipeId)
        })
        res.json({
            'message': "data deleted successfully"
        })
    })

    // Task 6: Create an endpoint to add a review to a recipe Endpoint recipes/<recipeId>/reviews 
    app.post('/recipes/:recipeId/reviews', async function (req, res) {
        const results = await db.collection('recipes-api').updateOne({
            _id: ObjectId(req.params.recipeId)
        }, {
            '$push': {
                'reviews': {
                    '_id': ObjectId(),
                    'email_add': req.body.email_add,
                    'content': req.body.content,
                    'rating': req.body.rating
                }
            }
        })
        res.json({
            'message': 'Review has been added successfully',
            'results': results
        })



    })

    // Task 7: Get recipe details

    app.get('/recipes/:recipeId', async function (req, res) {

        try {

            const recipes = await db.collection('recipes-api').findOne({
                _id: ObjectId(req.params.recipeId)
            });
            res.json(recipes);

        } catch (e) {
            console.log(e)
            res.status(500);
            res.json({
                'error': "Internal Server Error"
            })

        }

    })



    // Task 8: Update a review for a recipe End Point recipes/<recipeId>/reviews/<reviewId>

    app.put('/recipes/:recipeId/reviews/:reviewId', async function (req, res) {

        try {
            const results = await db.collection('recipes-api').updateOne({
                'reviews._id': ObjectId(req.params.reviewId)
            }, {
                '$set': {
                    'reviews.$.email_add': req.body.email_add,
                    'reviews.$.content': req.body.content,
                    'reviews.$.rating': req.body.rating

                }
            })
            res.json({
                'message': 'review updated',
                'results': results
            })

        } catch (e) {
            console.log(e)
            res.status(500);
            res.json({
                'error': "Internal Server Error"
            })

        }



        

    })

// Users must be able to sign up for an account and log in via JSON web tokens

    app.post('/register', async function (req, res) {
        const results = await db.collection('accounts').insertOne({
            "email":req.body.email,
            "name": req.body.name,
            "lastname":req.body.lastname,
            "birthday":req.body.birthday,
            "username":req.body.username,
            "password":req.body.password,

        });
        res.json({
            'message':'account created',
            'results':results
        })


    })
    // login
    app.post('/login', async function (req,res){

        const acount = await db.collection('accounts').findOne({
            'username':req.body.username,
            'password':req.body.password
        })
        if (acount){
            let token = generateAccesToken(acount.username,acount.password);
            res.json({
                'accessToken':token
            })
        }else {
            res.status(401)
            res.json({
                'message':'Incorect username or password'
            })
        }

    })




}
run();

//server
app.listen(3000, function () {
    console.log("server running")


})