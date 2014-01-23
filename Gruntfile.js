module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    // A very basic default task.
    grunt.registerTask('default', 'Log some stuff.', function() {
            this.async();
            grunt.log.write('Logging some stuff...').ok();
       var File = require('./file');
        var jsdiff = require('./jsdiff');
        var nodemailer = require("nodemailer"); //https://github.com/andris9/Nodemailer
        var transport = nodemailer.createTransport("SMTP", {
            host: "smtp.gmail.com", // hostname
            secureConnection: true, // use SSL
            port: 465, // port for secure SMTP
            auth: {
                user: "brandon.weis.ong@gmail.com",
                pass: "19brandonweis86"
            }
        });

        // var file = new File("C:/Users/kong/Downloads/au");
        // file.searchReplaceContentInDir("/au/en/", "/lenovorwdap/au/en/")

        // var fileObj1 = new File("C:/Users/kong/Documents/test1");
        // var fileObj2 = new File("C:/Users/kong/Documents/test2");
        
        var fileObj1 = new File("C:/Users/kong/Downloads/au");
        var fileObj2 = new File("C:/Users/kong/Downloads/au_before");


        File.diff(fileObj1, fileObj2, function(fileLog){
          // console.log(fileLog);
          var emailBody = "";
          // change log will display here
          fileLog.forEach(function(item){ + 

            console.log(item.action + " " + item.filePath);
            emailBody = emailBody + item.action + " " + item.filePath + "\r\n";

          })

          if(emailBody == "")
            emailBody = "no files were changed";


          var mailOptions = {
              from: "brandon.weis.ong@gmail.com",
              to: "kokweiong@gmail.com",
              // cc: "matt.williams@lenovo.com, klim2@lenovo.com, mabdul@lenovo.com, sc@lenovo.com, ym@lenovo.com, pkpuppala@lenovo.com",
              subject: "Another Hello world!",
              text: emailBody
          }

          transport.sendMail(mailOptions, function(error, response){
              if(error){
                  console.log(error);
              }else{
                  console.log("Message sent: " + response.message);
              }

              // if you don't want to use this transport object anymore, uncomment following line
              transport.close(); // shut down the connection pool, no more messages
          });

        });
    });

};