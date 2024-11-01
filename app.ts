const express = require("express");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT;
const app = express();
const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");

app.use(cors());
app.use(express.json());
app.use("/", userRouter);
app.use("/", authRouter);

app.listen(PORT || 4000, () => {
  console.log(`its working on port ${PORT || 4000}`);
});
