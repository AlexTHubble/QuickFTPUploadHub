const fs = require('fs');

const express = require('express');
var app = express();

//Node-FTP github https://github.com/mscdex/node-ftp
const Client = require('ftp'); 
const HubTracker_Config = require('./HubTracking_Config.js') //Change this to wherever the config is stored
const fmpAuthentication = HubTracker_Config.fmpAuthentication_Config;
const ftpConfig = HubTracker_Config.FTPConnector_Config;

//----------Logic Start---------

///Volumes/Server/PODs/UploadFTP

var baseDir = '/Volumes/Server/PODs/Upload FTP'

var files = CreateUploadObject(baseDir)

if(files.length == 0)
{
    console.log("Nothing to upload, exiting")
}
else
{
    var ftpClient = new Client();
    ftpClient.on('ready', function() {
    
        files.forEach(file =>
        {
            var FPTLocation = "PODs/" + file.year + "/" + file.month + "/" + file.day + "/" + file.filename
            console.log("Uploading " + file.filename + " to " + FPTLocation)
            ftpClient.put(file.path, FPTLocation, function(err) 
            {
                if (err) throw err;
                ftpClient.end();
            });
        })
        console.log("Finished")
    });
    ftpClient.connect(ftpConfig);
}


//Sweeps through the toupload folder and creates a list of objects for each file to upload
function CreateUploadObject(path)
{
    var filePaths = []; //yyyy/mm/dd/file.ext

    var yearsFS = fs.readdirSync(path);
    //Gets all the years in the base folder
    yearsFS.forEach(year =>
    {
        yearPath = path + "/" + year
        var yearStats = fs.statSync(yearPath)
        if(yearStats.isDirectory() && year != "Upload FTP.app")
        {
            var monthFS = fs.readdirSync(yearPath)
            monthFS.forEach(month =>
            {
                monthPath = yearPath + "/" + month;
                var monthStats = fs.statSync(monthPath)
                if(monthStats.isDirectory())
                {
                    var dayFS = fs.readdirSync(monthPath)
                    dayFS.forEach(day =>
                    {
                        dayPath = monthPath + "/" + day;
                        var dayStats = fs.statSync(dayPath)
                        if(dayStats.isDirectory())
                        {
                            var podFS = fs.readdirSync(dayPath)
                            podFS.forEach(pod =>
                            {
                                var podPath = dayPath + "/" + pod
                                var podStats = fs.statSync(podPath)

                                if(podStats.isFile())
                                {
                                    var filedata =
                                    {
                                        path: podPath,
                                        year: year,
                                        month: month,
                                        day: day,
                                        filename: pod
                                    }

                                    filePaths.push(filedata)
                                }
                            })
                        }

                    })
                }
            })
        }
    })

    return filePaths
}