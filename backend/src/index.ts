import app from './server';

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Error starting server: ${error}`);
  } else {
    console.log(`Server listening on port ${PORT}`);
    console.log('Swagger docs available at http://localhost:3000/api-docs');
  }
});
