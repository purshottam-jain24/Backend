import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config();
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("MONGO db connection failed !!! ", err);
  });
