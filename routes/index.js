var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");


/* GET home page. */
router.get("/", function(req, res) {
  client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
      "(//name[@type='place'])[1]",
      function(error, result) {
        if(error){console.error(error);}
        else {
          res.render('index', {title: 'Colenso Project', place: result.result});
        }
      });
});


router.get("/list", function(req, res) {
  var path = 'Colenso';
  var filePath =req.query.place;
  if(filePath === undefined){
    path = "Colenso";
  }
  else {
    path = filePath.substring(1, (filePath.length-1));
  }
  var path2 = path;
  // path = 'Colenso/Broughton'
  client.execute("XQUERY file:list('"+path+"')",
      function(error, result) {
        if(error){
          client.execute("XQUERY db:list('Colenso', '"+path+"')",
              function(error, result){
                if(error){console.log(error)}
                else{
                  res.render('list', {title: 'File Explorer', place: list, path: path2});
                }
              });
        }
        else {
          var list = result.result;
          list = list.split("\n");
          res.render('list', {title: 'File Explorer', place: list, path: path2});
        }
      });
});

router.get('/search', function(req, res){
  var searchParameter = req.query.searchString;
  client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
      "//name[@type = 'place' and position() = 1 and . = '"+searchParameter+"']",
      function(error, result) {
        if(error){console.error(error);}
        else {
          res.render('search', {title: 'Colenso Project', place: result.result});
        }
      });

  //res.render('search', {title: "Colenso Project", content: req.query.searchString});
});

router.get('/viewDoc', function(req, res){
  var docPath = req.query.doc;
  docPath = docPath.substring(1);
  client.execute("XQUERY doc('"+docPath+"')",
      function(error, result){
        if(error){console.error(error);}
        else {
          res.render('viewDoc', {path: docPath, title: 'Colenso Project', doc: result.result});
        }
      });
//"XQUERY declare namespace tei='http://www.tei-c.org/ns/1.0'; " +
//  "(doc('"+docPath+"')//tei:p)[1]"
  //res.render('search', {title: "Colenso Project", content: req.query.searchString});
});

module.exports = router;
