var fs = require('fs');
var ejs = require('ejs');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf8');

// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'XXXXXX',
  consumer_secret: 'XXXXXX',
  token: 'XXXXXX',
  token_secret: 'XXXXXX'
});

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('XXXXXX');


function csvParse(csvFile) {
  var arrWithObjs = [];
  var newLines = csvFile.split('\n');
  var header = newLines[0].split(',');

  for (var i = 1; i < newLines.length; i++) {
    // var objForArr = {};
    var newContact = newLines[i].split(',');
    var contactObj = {};
    for (var j = 0; j < newContact.length; j++) {
      contactObj[header[j]] = newContact[j];
    }
    arrWithObjs.push(contactObj);
  }
  return arrWithObjs;

}

client.posts('magicalmysterycode.tumblr.com', function(err, blog) {
  var latestPosts = [];

  for (var i = 0; i < blog.posts.length; i++) {
    var curDate = new Date();
    var blogDate = blog.posts[i].date;

    if (blogDate.substring(0,4) == curDate.getFullYear()) {
      if (blogDate.substring(5,7) == curDate.getMonth() + 1) {
        if (Math.abs(blogDate.substring(8,10) - curDate.getDate()) <= 7) {
          latestPosts.push(blog.posts[i]);
        }
      }
    }
  }
  var friendList = csvParse(csvFile);

  friendList.forEach(function(friend) {
    firstName = friend.firstName;
    numMonthsSinceContact = friend.numMonthsSinceContact;
    console.log(friend);

    copyTemplate = emailTemplate;

    var customizedTemplate = ejs.render(copyTemplate, {
      firstName: firstName,
      numMonthsSinceContact: numMonthsSinceContact,
      latestPosts: latestPosts
    });
    console.log(customizedTemplate);
    console.log(latestPosts);
    console.log('attempting to send email..');
    sendEmail(firstName, friend.emailAddress, 'Jamie Shen', 'jmeshen@gmail.com', 'Sending Mail with Tumblr Mailer + EJS', customizedTemplate);
  });


});

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
  var message = {
      "html": message_html,
      "subject": subject,
      "from_email": from_email,
      "from_name": from_name,
      "to": [{
              "email": to_email,
              "name": to_name
          }],
      "important": false,
      "track_opens": true,
      "auto_html": false,
      "preserve_recipients": true,
      "merge": false,
      "tags": [
          "Fullstack_Tumblrmailer_Workshop"
      ]
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
      // console.log(message);
      // console.log(result);
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
}
