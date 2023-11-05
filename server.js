import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Import the library directly
import { v4 as uuidv4 } from "uuid";

import User from "./models/usersSchema.js";

//connect to express app
const app = express()
const PORT = 5001
const SECRET_KEY = "secretkey"

//connect to MongoDB
const dbURI = "mongodb+srv://serviceUser:ServiceUser1@cluster0.ptduzzq.mongodb.net/?retryWrites=true&w=majority";
//"mongodb://localhost:27017/user-auth"
mongoose
    .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port: http://localhost:${PORT} and connected to MongoDb`)
        })
    })
    .catch(error => {
        console.log(`Unable to connect to server or mongodb`)
    })

//middleware
app.use(bodyParser.json())
app.use(cors())

//Routes
//User registration
//Post register

app.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, username, email, password } = req.body
        
        const hashedPassword = await bcrypt.hash(password, 10)

        const userId = uuidv4()

        const newUser = new User({ userId: userId, firstname, lastname, username, email, password: hashedPassword })

        await newUser.save()

        const userCreationResponse = {
            userId: userId,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            username: newUser.username,
            email: newUser.email,
        }

        res.status(201).json(userCreationResponse)
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Error signing up"})
    }
})

app.get("/register", async (req, res) => {
    try {
        const users = await User.find()

        res.status(201).json(users)
    } catch (error) {
        res.status(500).json({error: "Unable to get users"})
    }
})

//get login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        const token = jwt.sign({ username: user.username, userId: user.userId }, SECRET_KEY, { expiresIn: '1hr' })
        // Set the token as an HTTP-only cookie
        res.cookie('jwtToken', token, { httpOnly: true });

        const userLoginResponse = {
            userId: user.userId,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            email: user.email,
            token: token
        }

        res.json(userLoginResponse);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error logging in' })
    }
})


