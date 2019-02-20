/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var asserttype = require('chai-asserttype');
var assert = chai.assert;
var server = require('../server');
var expect = require('chai').expect;

chai.use(require('chai-string'));
chai.use(chaiHttp);
chai.use(asserttype);

suite('Functional Tests', function() {
  
  var serverURL = 'http://127.0.0.1'
  var board = 'function-test';
  var threadURL = '/api/threads/' + board;
  var replyURL = '/api/replies/' + board + '/';
  var testCase1 = 
  {
    'thread_id': '',
    'thread_text' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'thread_password' : 'hocus pocus',
    'reply_id' : '',
    'reply_text' : 'Nam sit amet suscipit risus. Nullam est turpis, convallis et malesuada a, convallis quis magna.',
    'reply_password' : 'abracadabra',
  };
  
  var testCase2 = 
  {
    'thread_id': '',
    'thread_text' : 'Nunc ac ex in dolor aliquam porta euismod vitae nisl. ',
    'thread_password' : 'alakazam',
    'reply_id' : '',
    'reply_text' : 'Curabitur orci turpis, feugiat sed erat eget, placerat gravida velit.',
    'reply_password' : 'presto chango',
  };
  
  
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      test('POST1 to /api/threads/:board => Redirect to /b/:board', function(done) {
        chai.request(server)
          .post(threadURL)
          .send({
            text: testCase1.thread_text,
            delete_password: testCase1.thread_password
          })
          .end(function(err, res){
           assert.equal(res.status, 200);
            //console.log(res);
           expect(res).to.redirect;
          assert.startsWith(res.redirects[0], serverURL);
          assert.endsWith(res.redirects[0], '/b/' + board + '/');
          //The only response for a correct input is 'http://127.0.0.1:' + SOME_PORT + '/b/' + board + '/'
            done();
          });
      });
      
      test('POST2 to /api/threads/:board => Redirect to /b/:board', function(done) {
        chai.request(server)
          .post(threadURL)
          .send({
            text: testCase2.thread_text,
            delete_password: testCase2.thread_password
          })
          .end(function(err, res){
           assert.equal(res.status, 200);
            //console.log(res);
           expect(res).to.redirect;
          assert.startsWith(res.redirects[0], serverURL);
          assert.endsWith(res.redirects[0], '/b/' + board + '/');
          //The only response for a correct input is 'http://127.0.0.1:' + SOME_PORT + '/b/' + board + '/'
            done();
          });
      });
      
    });
    
    suite('GET', function() {
      test('GET to /api/threads/:board  => Array of objects with thread data - Test First Object', function(done) {
        chai.request(server)
          .get(threadURL)
          .query({})    
          .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isArray(res.body);
           assert.isAtMost(res.body.length, 10);
           
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.notProperty(res.body[0], 'delete_password');
            assert.notProperty(res.body[0], 'reported');
            assert.property(res.body[0], 'replies');		

            assert.typeOf(res.body[0]._id, 'string');
            assert.typeOf(res.body[0].text, 'string');
            expect(res.body[0].created_on).to.be.number();
            expect(res.body[0].bumped_on).to.be.number();

            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            if (res.body[0].replies.length >0)
            {	
            assert.property(res.body[0].replies[0], '_id');
            assert.property(res.body[0].replies[0], 'text');
            assert.property(res.body[0].replies[0], 'created_on');
            assert.notProperty(res.body[0].replies[0], 'delete_password');
            assert.notProperty(res.body[0].replies[0], 'reported');

            assert.typeOf(res.body[0].replies[0]._id, 'string');
            assert.typeOf(res.body[0].replies[0].text, 'string');
            expect(res.body[0].replies[0].created_on).to.be.number();

            };
            
            done();
          });
      });
      test('GET to /api/threads/:board  => Array of objects with thread data - Test All Objects', function(done) {
        chai.request(server)
          .get(threadURL)
          .query({})    
          .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isArray(res.body);
           assert.isAtMost(res.body.length, 10);
           
           res.body.forEach(function (element)
           {
              assert.property(element, '_id');
              assert.property(element, 'text');
              assert.property(element, 'created_on');
              assert.property(element, 'bumped_on');
              assert.notProperty(element, 'delete_password');
              assert.notProperty(element, 'reported');
              assert.property(element, 'replies');		

              assert.typeOf(element._id, 'string');
              assert.typeOf(element.text, 'string');
              expect(element.created_on).to.be.number();
              expect(element.bumped_on).to.be.number();

              assert.isArray(element.replies);
              assert.isAtMost(element.replies.length, 3);
              element.replies.forEach(function (reply)
              {	
                assert.property(reply, '_id');
                assert.property(reply, 'text');
                assert.property(reply, 'created_on');
                assert.notProperty(reply, 'delete_password');
                assert.notProperty(reply, 'reported');

                assert.typeOf(reply._id, 'string');
                assert.typeOf(reply.text, 'string');
                expect(reply.created_on).to.be.number();

              });		
          });
            //Record IDs for the rest of the testing
            if (res.body.length >= 2)
            {
               testCase1.thread_id = res.body[1]._id;
               testCase2.thread_id = res.body[0]._id;
               //console.log(testCase1);
               //console.log(testCase2);
            }

            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Invalid Password', function(done) {
        chai.request(server)
        .delete(threadURL)
        .send({
          thread_id : testCase1.thread_id,
          delete_password : testCase1.thread_password+'1'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');

          done();
        });
      });

      test('Valid Password', function(done) {
        chai.request(server)
        .delete(threadURL)
        .send({
          thread_id : testCase1.thread_id,
          delete_password : testCase1.thread_password
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');

          done();
        });
      });      
    });
    
    suite('PUT', function() {
      test('Test Reporting', function(done) {
         chai.request(server)
          .put(threadURL)
          .send({                
            thread_id : testCase2.thread_id
          })
          .end(function(err, res){
           assert.equal(res.status, 200);

           //Test required fields that we received explicitly 
           assert.equal(res.text, 'success');


            done();
          });   
        
        });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('POST1 to /api/replies/:board/:thread => Redirect to /b/:board/:thread', function(done) {
        chai.request(server)
          .post(replyURL)
          .send({
			      thread_id: testCase2.thread_id,
            text: testCase1.reply_text,
            delete_password: testCase1.reply_password
          })
          .end(function(err, res){
           assert.equal(res.status, 200);
            //console.log(res);
           expect(res).to.redirect;
          assert.startsWith(res.redirects[0], serverURL);
          assert.endsWith(res.redirects[0], '/b/' + board + '/' + testCase2.thread_id);
          //The only response for a correct input is 'http://127.0.0.1:' + SOME_PORT + '/b/' + board + '/'  + thread_id
            done();
          });
      });
      
test('POST2 to /api/replies/:board/:thread => Redirect to /b/:board/:thread', function(done) {
        chai.request(server)
          .post(replyURL)
          .send({
			      thread_id: testCase2.thread_id,
            text: testCase2.reply_text,
            delete_password: testCase2.reply_password
          })
          .end(function(err, res){
           assert.equal(res.status, 200);
            //console.log(res);
           expect(res).to.redirect;
          assert.startsWith(res.redirects[0], serverURL);
          assert.endsWith(res.redirects[0], '/b/' + board + '/' + testCase2.thread_id);
          //The only response for a correct input is 'http://127.0.0.1:' + SOME_PORT + '/b/' + board + '/'  + thread_id
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('GET to /api/replies/:board/:thread  => Object with thread data - Test All Objects', function(done) {
        chai.request(server)
          .get(replyURL)
          .query({
              thread_id : testCase2.thread_id
            })    
          .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isObject(res.body);

            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.notProperty(res.body, 'delete_password');
            assert.notProperty(res.body, 'reported');
            assert.property(res.body, 'replies');		

            assert.typeOf(res.body._id, 'string');
            assert.typeOf(res.body.text, 'string');
            expect(res.body.created_on).to.be.number();
            expect(res.body.bumped_on).to.be.number();

            assert.isArray(res.body.replies);

            res.body.replies.forEach(function (reply)
            {	
            assert.property(reply, '_id');
            assert.property(reply, 'text');
            assert.property(reply, 'created_on');
            assert.notProperty(reply, 'delete_password');
            assert.notProperty(reply, 'reported');

            assert.typeOf(reply._id, 'string');
            assert.typeOf(reply.text, 'string');
            expect(reply.created_on).to.be.number();

            });		
            //Record IDs for the rest of the testing
            if (res.body.replies.length >= 2)
            {
               testCase1.reply_id = res.body.replies[0]._id;
               testCase2.reply_id = res.body.replies[1]._id;
               //console.log(testCase1);
               //console.log(testCase2);
            }

            done();
          });    
        });
    });
    
    suite('PUT', function() {
      test('Test Reporting', function(done) {
         chai.request(server)
          .put(replyURL)
          .send({                
            thread_id : testCase2.thread_id,
			      reply_id : testCase1.reply_id
          })
          .end(function(err, res){
           assert.equal(res.status, 200);

           //Test required fields that we received explicitly 
           assert.equal(res.text, 'success');


            done();
          });   
        
        });      
    });
    
    suite('DELETE', function() {
      test('Invalid Password', function(done) {
        chai.request(server)
        .delete(replyURL)
        .send({
          thread_id : testCase2.thread_id,
          reply_id : testCase2.reply_id,
          delete_password : testCase2.reply_password+'1'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');

          done();
        });
      });

      test('Valid Password', function(done) {
        chai.request(server)
        .delete(replyURL)
        .send({
          thread_id : testCase2.thread_id,
          reply_id : testCase2.reply_id,
          delete_password : testCase2.reply_password //Valid
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');

          done();
        });
      }); 
      test('Cleanup - Valid Password', function(done) {
        chai.request(server)
        .delete(threadURL)
        .send({
          thread_id : testCase2.thread_id,
          delete_password : testCase2.thread_password
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');

          done();
        });
      }); 
    });
    
  });

});
