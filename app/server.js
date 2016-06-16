import express from 'express';

// sets up our express app
const app = express();


// default index route
// this does nothing for us
app.get('/', (req, res) => {
  res.send('hi');
});

/* the majority of your logic can go here */


// START THE SERVER
const port = process.env.PORT || 9090;
app.listen(port);
console.log(`listening on: ${port}`);
