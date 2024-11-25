const fs = require('fs');
const axios = require('axios');
var express = require('express');
const csv = require('csv-parser');
const FormData = require('form-data');
// const { Solver } = require('@2captcha/captcha-solver');

const app = express();

// const solver = new Solver("d01b6c5a017cee99152301914ea2d98e");

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
        // Access cookies from the response headers
        // const cookies = response.headers['set-cookie'];

        // const authCookie = cookies.find(cookie => cookie.startsWith('snapcentro_auth='));

        
        const authToken = response.headers["x-auth-token"];
        if (authToken) {
        console.log(response, authToken)
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

app.get('/', (req, res) => {
  res.status(200).send('Tipestry Bot');
})

app.get('/post', async (req, res) => {
  try {

    // Login
    const loginData = await login('pratibha@yopmail.com', 'Test@123');
 
    const userData = await getUserDetails(loginData.authToken);
    console.log("userData", userData);

    const collection = loginData.data.response.member.collection;

    const clientId = Object.keys(collection)[0];

    readCSVList('list.csv').then((data) => {
      data.map(async (item) => {
        // Create new item
        const newData = await newItem(loginData.auth, clientId);

        // Upload item file
        await uploadItem(newData.data.data.id, item.Image);

        const publishDate = Math.round(+new Date(item.StartDate) / 1000);
        const expirationDate = Math.round(+new Date(item.EndDate) / 1000);

        // Create Post
        const postData = await createPost(loginData.auth, item.Title, newData.data.data.id);

        await updatePost(loginData.auth, postData.data.response.id, publishDate, expirationDate);

        const tags = item.Tags.split(' ');

        for (let i = 0; i < tags.length; i++) {
          await attachTag(loginData.auth, postData.data.response.id, tags[i].replace('#', ''));
        }

        await schedulePost(loginData.auth, postData.data.response.id, publishDate);

        return res.send('Post Created!');
      })
    });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: error });
  }
})

// Start Server
const PORT = 4000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));