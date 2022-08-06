// require Express
const express = require('express');
//require cors
const cors = require('cors');
require('dotenv').config();



// require MongoUtil
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
                'ingredients':1,
                'prep_time': 1,
                'cook_time': 1,
                'total_time':1,
                'cost':1 
            }


        }).toArray();
        res.json(recipes);
    })

    // Task 4 Create a Update Recipe Endpoint The URL for the endpoint should be /recipes/<recipeId>
    app.put('/recipes/:recipeId', async function (req, res) {


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
        const recipes = await db.collection('recipes-api').findOne({
            _id: ObjectId(req.params.recipeId)
        });
        res.json(recipes);
    })



    // Task 8: Update a review for a recipe End Point recipes/<recipeId>/reviews/<reviewId>

    app.put('/recipes/:recipeId/reviews/:reviewId', async function (req, res) {
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

    })

   


}
run();

//server
app.listen(3000, function () {
    console.log("server running")


})