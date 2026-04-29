import app from "./app";

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
