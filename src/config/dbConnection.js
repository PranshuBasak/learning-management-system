import mongoose from "mongoose";
import { DB_NAME } from "../constant.js"

mongoose.set("strictQuery", false);

async function connectToDB() {
    try {
        const { connection } = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)

        if (connection) {
            console.log(`✅ Connected to MongoDB: ${connection.host}`);
        }
    } catch (error) {
        console.log("❌ Error Connecting to DB: ", error);
        process.exit(1);
    }
}

export default connectToDB;