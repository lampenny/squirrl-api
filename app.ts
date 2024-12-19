const express = require("express");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT;
const app = express();
const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const financesRouter = require("./routes/finances");

app.use(cors());
app.use(express.json());
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/finances", financesRouter);

app.listen(PORT || 4000, () => {
  console.log(`its working on port ${PORT || 4000}`);
});
