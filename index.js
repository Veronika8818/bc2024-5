const fs = require('fs');
const path = require('path');
const express = require('express');
const { program } = require('commander');


program
.requiredOption('-h, --host <host>', 'Server host address')
.requiredOption('-p, --port <port>', 'Server port number')
.requiredOption('-c, --cache <cacheDir>', 'Cache directory path');

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = options.port;
const cachePath = options.cache;

const server = express();

if (!host){
    console.log('Error:  Missing required argument --host')  
}
if (!port){
    console.log ('Error:  Missing required argument --port')
}
if(!cachePath){
    console.log('Error:  Missing cache directory')
}



server.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
  });
  

server.listen(port, host, () => {
    console.log('Server is running at http://${host}:${port}')
});
