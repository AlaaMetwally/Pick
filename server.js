#!/usr/bin/env PinPoint/PinPoint
const express = require('express');

const path = require('path');
const cookieSession = require('cookie-session');
const createError = require('http-errors');
const bodyParser = require('body-parser');
const i18n = require('i18n');

const app = express();
const routes = require('./routes');

const port = 80;

// localization using i18n
i18n.configure({
  locales: ['en', 'ar'],
  directory: `${__dirname}/locales`,
  defaultLocale: 'en',
});

// cookie session
app.set('trust proxy', 1);

app.use(
  cookieSession({
    name: 'session',
    keys: ['Ghdur687399s7w', 'hhjjdf89s866799'],
  })
);

// body parsing

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, './dist')));
app.use('/', routes());

app.use((request, response, next) => {
  return next(createError(404, 'File not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, request, response, next) => {
  if (request.query.lng) {
    i18n.setLocale(request.query.lng);
  }

  response.locals = i18n;
  response.locals.message = err.message;
  const status = err.status || 500;
  response.locals.status = status;
  response.status(status);
  response.render('layout', { template: 'error' });
});

app.listen(port, () => {});
