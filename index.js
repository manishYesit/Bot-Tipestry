const fs = require('fs');
const path = require('path');
const axios = require('axios');
var express = require('express');
const csv = require('csv-parser');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');

const app = express();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/csv/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${timestamp}${ext}`);
  },
});
const upload = multer({ storage });


function login(email, passwd) {
  return new Promise((resolve, reject) => {
    let data = {};

    Object.assign(data, {'email': email});
    Object.assign(data, {'password': passwd});
    let config = {
      method: 'post',
      url: 'https://new.tipestry.com/api/auth',
      data: data
    };

    axios.request(config)
      .then((response) => {
        
        const authToken = response.headers["x-auth-token"];
        if (authToken) {
        resolve({ status: true, message: 'success', data: response.data, authToken });
        } else {
          resolve({ status: false, message: 'Login failed' });
        }
      })
      .catch((error) => {
        console.log(error);
        resolve({ status: false, message: error });
      });
  })
}

function getUserDetails(token) {
  return new Promise((resolve, reject) => {
    let config = {
      method: 'get',
      url: 'https://new.tipestry.com/api/user',
      headers: {
        'X-Auth-Token':token
      }
    };

    axios.request(config)
      .then((response) => {
        if (response.data) {
        resolve({ status: true, message: 'success', data: response.data });
        } else {
          resolve({ status: false, message: 'Request failed' });
        }
      })
      .catch((error) => {
        console.log(error);
        resolve({ status: false, message: error });
      });
  })
}

function readCSVList(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  })
}

function createPost(token, postData) {
  return new Promise((resolve, reject) => {
    let data = {};
    
    Object.assign(data, {'groupId': postData.groupId});
    Object.assign(data, {'isoriginalcontent': postData.isoriginalcontent.toUpperCase() === 'TRUE'});
    Object.assign(data, {'message': postData.message});
    Object.assign(data, {'tags': JSON.parse(postData.tags)});
    Object.assign(data, {'title': postData.title});
    Object.assign(data, {'url': postData.url});

    let config = {
      method: 'post',
      url: 'https://new.tipestry.com/api/topic',
      headers: {
        'X-Auth-Token':token,
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        resolve({ status: true, data: response.data });
      })
      .catch((error) => {
        resolve({ status: false, message: error });
      });
  })
}

app.use(cors({
  origin: 'http://127.0.0.1:5500'
}));

app.get('/', (req, res) => {
  res.status(200).send('Tipestry Bot');
})

app.post('/post', upload.single('file'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded' });
    }
    // Login
    const loginData = await login('pratibha@yopmail.com', 'Test@123');
 
    const userData = await getUserDetails(loginData.authToken);

    const filePath = req.file.path;
    // return;

    readCSVList(filePath).then((data) => {
      
      data.map(async (item) => {
        const postData = await createPost(loginData.authToken, item);
        console.log("postData is", postData);
      })
    });
    return res.status(200).json({ status: true, message: 'success', message: 'Posts created successfully'});
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: error });
  }
})

// Start Server
const PORT = 4000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));