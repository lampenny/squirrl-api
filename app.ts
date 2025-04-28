const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const PORT = process.env.PORT;
const app = express();

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      sameSite: "lax",
    },
  })
);

const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const financesRouter = require("./routes/finances");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/finances", financesRouter);

app.listen(PORT || 4000, () => {
  console.log(`its working on port ${PORT || 4000}`);
});
