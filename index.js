const fs = require('fs');
const axios = require('axios');
var express = require('express');
const csv = require('csv-parser');
const FormData = require('form-data');
const { Solver } = require('@2captcha/captcha-solver');

const app = express();

const solver = new Solver("d01b6c5a017cee99152301914ea2d98e");

function login(email, passwd, token) {
    return new Promise((resolve, reject) => {
      let data = {};
  
      Object.assign('email', email);
      Object.assign('password', passwd);
  
      let config = {
        method: 'post',
        url: 'https://new.tipestry.com/api/auth',
        data: data
      };
  
      axios.request(config)
        .then((response) => {
          // Access cookies from the response headers
          const cookies = response.headers['set-cookie'];
  
          const authCookie = cookies.find(cookie => cookie.startsWith('snapcentro_auth='));
  
          if (authCookie) {
            const authValue = authCookie.split(';')[0].split('=')[1];
            resolve({ status: true, message: 'success', data: response.data, auth: authValue });
          } else {
            resolve({ status: false, message: 'Login failed' });
          }
        })
        .catch((error) => {
          resolve({ status: false, message: error });
        });
    })
  }