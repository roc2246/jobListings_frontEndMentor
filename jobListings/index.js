const app = require('./app');
const port = process.env.PORT || 2000;

// Set up server
app.listen(port, () => {
    console.log(`Server is up at port ${port}`);
    console.log(`http://localhost:${port}`)
  });