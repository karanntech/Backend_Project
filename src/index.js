import connectDB from "./db/db.js";
import dotenv from "dotenv";


dotenv.config({
    path: "./env"
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,() => {
        console.log(`Server is running at Port : ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("MongoDB connection Failed!!!", error);
})