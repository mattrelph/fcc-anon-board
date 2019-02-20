/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;


//if we are going to store passwords, we should encrypt them
const bcrypt = require('bcrypt');      //Require BCrypt
const saltRounds = 12;

var uniqid = require('uniqid');


//Setup database
const MongoClient = require('mongodb');
const dbCollection = "fcc-anon-board-";
const  db = require('../db/database.js');
const ObjectId = require('mongodb').ObjectID;

/*
DB arrangement
collection = "fcc-anon-board-" + board name
threads : 
			 _id : u_id
			 text : string
			 created_on : Date Object (date&time)
			 bumped_on : Date Object (date&time, starts same as created_on)
			 reported : (boolean)
			 delete_password : BCrypt Hash
			replies : [{
				      _id : unique id
							text : string
							created_on  : Date Object (date&time), 
							reported : (boolean), 
							delete_password : BCrypt Hash			
			}]
*/


module.exports = function (app) {
 
  db.connect(() => {
    app.listen(function (){
        console.log(`Database Listening`);
    });
  });
  
  app.route('/api/threads/:board')
    //Get - gets recent threads
    /*Receive: None

        Save: None

        Return: An array of 10 most recently bumped threads from /api/threads/{board}
        Only last three replies each
        Cleaned of delete_password and reported fields
      */  
   .get(function (req, res)
    {      
      var board = req.params.board;
      db.get().collection(dbCollection+board).find().sort({'bumped_on':-1}).limit(10).toArray(function (err, result) 
      //db.get().collection(dbCollection+board).find().limit(10).toArray(function (err, result) 
      {
        if(err) 
        {
          console.log('Database read error: ' + err);
          res.status(500).end();
        } 
        else 
        {
          //console.log('GET OUTPUT: ' + JSON.stringify(result));
          //console.log(result.length);
          result.forEach(function(element) 
          {
            //Delete requested fields
            delete element['delete_password']; 
            delete element['reported']; 
            //Only return last 3 replies
            
            if (element.replies != null)
            {
              element.replycount = element.replies.length;    //Not mentioned in the user stories, but the user interface called for the total number of replies to a thread
              //console.log(element.replies.length);
              while (element.replies.length >3)
              {
                element.replies.shift();  //Leave only the last three elements in the array
              }
              element.replies.forEach(function(reply) //Now clear out unwanted fields for response
              {
                delete reply['delete_password']; 
                delete reply['reported']; 
              });
            }
          });
          //console.log('CLEANED OUTPUT: ' + JSON.stringify(result));
          
          res.status(200).json(result);    //Upon successful insertion, we will now respond with the inserted object.
        }


      });   
      
    })
  
  
    //Post - create new thread
    /*Receive: text
                delete_password 
      
      Save:_id, 
            text, 
            created_on (date&time), 
            bumped_on (date&time, starts same as created_on), 
            reported (boolean), 
            delete_password, 
            replies (array)
            
      Return: res.redirect to board page /b/{board}
    */  
   .post(function (req, res)
    { 
      var board = req.params.board;
      if (req.body.hasOwnProperty('text')&&req.body.hasOwnProperty('delete_password'))  //Check if required data is being sent
      {
        var currentTime = Date.now();
        //console.log(req.body);
        var thread = 
        {  
          'text' : req.body.text,
          'delete_password' : bcrypt.hashSync(req.body.delete_password, saltRounds),
          'created_on' : currentTime,
          'bumped_on' : currentTime,
          'reported' : false,
          'replies': [],
          
        };
        db.get().collection(dbCollection+board).insertOne(thread, function (err, result)     //Attempt to insert thread into DB
        {
           if (err)
           {
               console.log('Database insertion error: ' + err);
              res.status(500).end();
           }
           else
           {
             res.redirect('/b/' + board + '/');
           }
        });
                  
      }
      else
      {
        res.redirect('/b/' + board + '/');
      }
    })
  
  
    //Put - report thread
  /*Receive: thread_id  //In the user interface, this was initially "reported_id" which is inconsistent with user stories. Fixed in user interface to maintain continuity.

            Save: Updates reported field to "true"

            Return: 'success'
          */  
    .put(function (req, res)
    {
      if (req.body.hasOwnProperty('thread_id'))  //Check if required data is being sent
      {
        var board = req.params.board;    
        var myquery = { 
            '_id': ObjectId(req.body.thread_id)    //Search parameter
        };
        var newvalues = {
          'reported' : true    //Update to reported
        };
        db.get().collection(dbCollection+board).updateOne(myquery, {$set : newvalues}, function (err, result) 
          {
            if(err) 
            {
              console.log('Database update error: ' + err);
              res.status(500).end();
            } 
            else if (result.result.n >= 1)
            {
              //console.log('PUT Update: ' + JSON.stringify(result));
              res.status(200).send('success');    //Report upon updating the record 
              //Also, the original version of the backend tester checked for "reported" instead of "success", which didn't match the user stories. Fixed in my personalized version of the backend tester
            }
            else
            {
              //console.log('PUT Update: ' + JSON.stringify(result));
              //console.log(result.result.n);
              res.status(200).send('thread not found');
            }
        });
        
      }
      else
      {
          //console.log('missing inputs' + JSON.stringify(req.body));
          //console.log(req.params.board);
          //console.log(req.query);
        res.status(200).send('missing inputs');
      }
    })
  
  
    //Delete - deletes thread with password
    /*Receive: thread_id
                delete_password

          Save: deletes thread from DB

          Return: 'incorrect password' or 'success'
        */  
   .delete(function (req, res)
    {
    if (req.body.hasOwnProperty('thread_id')&&req.body.hasOwnProperty('delete_password'))  //Check if required data is being sent
      {
        var board = req.params.board;    
        var myquery = { 
            '_id': ObjectId(req.body.thread_id)    //Search parameter
        };
        var password = req.body.delete_password;
        //console.log(req.body.thread_id + ' ' + password);
      //Find the thread
       db.get().collection(dbCollection+board).findOne(myquery, function (err, result) 
      {
        if(err) 
        {
          console.log('Database read error: ' + err);
          res.status(500).end();
        } 
        else 
        {
          if (result != null)
          {
            //console.log('DELETE FETCH OUTPUT: ' + JSON.stringify(result));
            //Check Hash

            if(bcrypt.compareSync(req.body.delete_password, result.delete_password))     //Encrypted password check
            {
            // Passwords match
            //Delete thread
             db.get().collection(dbCollection+board).deleteOne(myquery, function (err, result) 
              {
                if(err) 
                {
                  console.log('Database document delete error: ' + err);
                  res.status(500).end();
                } 
                else 
                {
                  //console.log("DELETE FINAL OUTPUT: " + JSON.stringify(result));
                  res.status(200).send('success');   //Notify upon successful deletion.
                }
              });                 
              
            } 
            else 
            {
            // Passwords don't match
            //Return error
              //console.log("incorrect password - " + req.body.thread_id + ' ' + password);
              res.status(200).send('incorrect password');
            }            
            //res.status(200).send('success'); 
          }
          else
          {
            res.status(200).send('thread not found'); 
          }
        }


      });
    
      
        
      
      }
    else
    {
      /*console.log('missing inputs' + JSON.stringify(req.body));
          console.log(req.params.board);
          console.log(req.query);*/
      res.status(200).send('missing inputs');
    }
    
    })
  ;
  
  
  app.route('/api/replies/:board')
    //Get - gets all replies to thread
    /*Receive: thread_id

          Save: None

          Return: Entire thread from with /api/replies/{board}?thread_id={thread_id}
          Cleaned of delete_password and reported fields
        */  
     .get(function (req, res)
      {
        if (req.query.hasOwnProperty('thread_id'))  //Check if required data is being sent
        {
          var board = req.params.board;
          var myquery = { 
              '_id': ObjectId(req.query.thread_id)    //Search parameter
          };
          //console.log('GET INPUT: ' + board + ' + ' + myquery);
          db.get().collection(dbCollection+board).findOne(myquery, function (err, result) 
          {
            if(err) 
            {
              console.log('Database read error: ' + err);
              res.status(500).end();
            } 
            else if (result != null)
            {
              //console.log('GET OUTPUT: ' + JSON.stringify(result));
              //Delete requested fields
              delete result['delete_password']; 
              delete result['reported']; 
              if (result.replies != null)
              {
                result.replies.forEach(function(reply) //Now clear out unwanted fields for response
                {
                  delete reply['delete_password']; 
                  delete reply['reported']; 
                });
              }

              //console.log('CLEANED OUTPUT: ' + JSON.stringify(result));

              res.status(200).json(result);    //Upon successful insertion, we will now respond with the inserted object.
            }
            else
            {
              //console.log('GET: thread not found:' + result)
              res.status(200).send('thread not found');
            }


          });          
        }
        else
        {
          /*console.log('missing inputs' + JSON.stringify(req.body));
          console.log(req.params.board);
          console.log(req.query);*/
          res.status(200).send('missing inputs');
        }
      })
  
  
    //Post - create new reply
    /*Receive: text
                delete_password 
                thread_id
      
      Save: (to thread replies)
            _id, 
            text, 
            created_on (date&time), 
            reported (boolean), 
            delete_password 

            
      Return: res.redirect to thread page /b/{board}/{thread_id}
    */
    .post(function (req, res)
    {      
      var board = req.params.board;
      if (req.body.hasOwnProperty('text')&&req.body.hasOwnProperty('delete_password')&&req.body.hasOwnProperty('thread_id'))  //Check if required data is being sent
      {
        var currentTime = Date.now();
        //console.log(req.body);
        var myquery = { 
            '_id': ObjectId(req.body.thread_id)    //Search parameter
        };
        var newValues = {};
        newValues['$set'] = {
          'bumped_on' : currentTime
        };
        var newReply =                      
        {  
          'text' : req.body.text,
          'delete_password' : bcrypt.hashSync(req.body.delete_password, saltRounds),      //Encrypt the password
          'created_on' : currentTime,
          'reported' : false,
          '_id' : uniqid()    //We create a unique ID for each reply
        };
        newValues['$push'] = {'replies' : newReply};
        //console.log(newValues);
        
        db.get().collection(dbCollection+board).updateOne(myquery, newValues, function (err, result)     //Attempt to insert reply into DB
        {
           if (err)
           {
              console.log('Database insertion error: ' + err);
              res.status(500).end();
           }
           else
           {
             //console.log('POST REPLY:' +  result);
             res.redirect('/b/' + board + '/' + req.body.thread_id);
           }
        });
                  
      }
      else
      {
        res.redirect('/b/' + board + '/' + req.body.thread_id);
      }    
    })
  
  
    //Put - report reply
    /*Receive: thread_id
                reply_id

              Save: Updates reported field for reply to "true"

              Return: 'success'
            */  
    .put(function (req, res)
    { 
    
          
      if (req.body.hasOwnProperty('thread_id')&&req.body.hasOwnProperty('reply_id'))  //Check if required data is being sent
      {
        var board = req.params.board;    
        var myquery = { 
            '_id': ObjectId(req.body.thread_id),    //Search parameter
            'replies' : {'$elemMatch': {'_id' : req.body.reply_id}}
        };
        var newvalues = {
          'replies.$.reported' : true    //Update to reported
        };
        db.get().collection(dbCollection+board).updateOne(myquery, {$set : newvalues}, function (err, result) 
          {
            if(err) 
            {
              console.log('Database update error: ' + err);
              res.status(500).end();
            } 
            else if (result.result.n >= 1)
            {
              //console.log('PUT Update: ' + JSON.stringify(result));
              res.status(200).send('success');  //Report upon updating the record 
              //Also, the original version of the backend tester checked for "reported" instead of "success", which didn't match the user stories. Fixed in my personalized version of the backend tester
            }
            else
            {
              //console.log('PUT Update: ' + JSON.stringify(result));
              res.status(200).send('reply not found');  
            }
        });
        
      }
      else
      {
        //console.log('missing inputs' + JSON.stringify(req.body));
          //console.log(req.params.board);
          //console.log(req.query);
        res.status(200).send('missing inputs');
      }    
    
    })
  
  
    //Delete - deletes reply with password (Changes to "[deleted]"
    /*Receive: thread_id
                  reply_id
                  delete_password

            Save: Reply text changed to "[deleted]"

            Return: 'incorrect password' or 'success'
          */  
    .delete(function (req, res)
    {               
      if (req.body.hasOwnProperty('thread_id')&&req.body.hasOwnProperty('reply_id')&&req.body.hasOwnProperty('delete_password'))  //Check if required data is being sent
      {
        var board = req.params.board;    
        var myquery = { 
            '_id': ObjectId(req.body.thread_id),    //Search parameter
            'replies' : {'$elemMatch': {'_id' : req.body.reply_id}}
        };
        var newvalues = {
          'replies.$.text' : '[deleted]'    //Update to deleted
        };
        db.get().collection(dbCollection+board).findOne(myquery, function (err, result) 
          {
            if(err) 
            {
              console.log('Database update error: ' + err);
              res.status(500).end();
            } 
            else if (result != null)
            {
              //console.log('DELETE FETCH OUTPUT: ' + JSON.stringify(result));
              //Check Hash
              var hash="";
              //Need to get right reply hash
              for (var i = 0; i< result.replies.length; ++i)
              {
                if (result.replies[i]._id == req.body.reply_id)
                {
                  hash = result.replies[i].delete_password;    //Found the correct hash
                  break;
                }
              }
              if(bcrypt.compareSync(req.body.delete_password, hash))     //Encrypted password check
              {
              // Passwords match
              //Delete thread
               db.get().collection(dbCollection+board).updateOne(myquery, {'$set': newvalues}, function (err, reply) 
                {
                  if(err) 
                  {
                    console.log('Database document update error: ' + err);
                    res.status(500).end();
                  } 
                  else 
                  {
                    //console.log("DELETE FINAL OUTPUT: " + JSON.stringify(result));
                    res.status(200).send('success');   //Notify upon successful deletion.
                  }
                });                 

              } 
              else 
              {
              // Passwords don't match
              //Return error
                res.status(200).send('incorrect password');
              }            
            }
            else
            {
              //console.log('DELETE - REPLY NOT FOUND: ' + JSON.stringify(result));
              res.status(200).send('reply not found');
            }
        });
        
      }
      else
      {
        res.status(200).send('missing inputs');
      }        
    })
  ;
};
