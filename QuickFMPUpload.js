//THE SACRED TEXTS: Node-FTP github https://github.com/mscdex/node-ftp

const fs = require('fs');
const path = require('path');
const Client = require('ftp');
const HubTracker_Config = require('./HubTracking_Config.js') //Change this to wherever the config is stored
const ftpConfig = HubTracker_Config.FTPConnector_Config;

//----------Logic Start---------

///Volumes/Server/PODs/UploadFTP

const baseDir = '/Volumes/Server/PODs/Upload FTP'

const ftpClient = new Client();
ftpClient.on('ready', function()
{
    uploadToFMP(baseDir, ftpClient, "PODs");
    ftpClient.end();
});
ftpClient.connect(ftpConfig);

//-----Functions----

//Recursive function, will keep self calling until no directories are found within the file tree
function uploadToFMP(filePath, ftpClient, ftpPath)
{
    /*
    Steps...
    1 - Get a list of file within the path
    2 - Loop each file & check validity
    3 - If it's a directory - Check to see if the matching directory exists within the FTP server
        -If not, create it and call the function for the directory found
        -If so, call this function for the directory found
    4 - If it's a file, upload to the ftp server
     */
    const files = fs.readdirSync(filePath);
    files.forEach(file =>
    {
        //Checks the file extension for either .jpg or a directory
        let fileExtension = path.extname(file);
        if((fileExtension === '.jpg' || fileExtension === '') && file !== ".DS_Store")
        {
            //Grabs a list of all the files at the current FTP path
            //NEEDS to be queued up regardless of it's a directory or not, this way we can make sure that the directory exists when we move to upload a file
            //This works because it makes sure that the mkdir is queued before any files found
            ftpClient.list(ftpPath, function(err, list)
            {
                if (err) throw err;
                let fileData = fs.statSync(filePath + "/" + file);
                //I can't figure out why FS thinks Upload FTP.app is a directory
                if(fileData.isDirectory() && file)
                {
                    let found = false;
                    //If it's a directory, check the FTP for a matching directory
                    list.forEach(value =>
                    {
                        if(value.name === file)
                        {
                            found = true;
                            //Repeat function for the found directory
                            console.log(`Found folder at ${filePath + "/" + file}`);
                            uploadToFMP(filePath + "/" + file, ftpClient, ftpPath + "/" + file);
                        }
                    })
                    if(!found)
                    {
                        //File wasn't found, create a directory then repeat the function for the found directory
                        let newPath =  ftpPath + "/" + file
                        console.log(`Creating directory ${newPath}`);
                        ftpClient.mkdir(newPath, function(err) { if (err) throw err })
                        uploadToFMP(filePath + "/" + file, ftpClient, newPath);
                    }
                }
                else
                {
                    //If it's not a directory, upload it to the FTP server
                    ftpClient.put(filePath + "/" +file, ftpPath + "/" + file, function(err)
                    {
                        console.log(`Uploading ${file} to ${ftpPath}`);
                        if (err) throw err;
                    });
                }
            })
        }
    })
}