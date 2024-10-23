const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const multer = require('multer');
const path = require('path');

const { usermodel } = require("./models/Users")
const { ordermodel } = require("./models/Orders")
const { productmodel }=require("./models/Products")

const app = express()
app.use(cors())
app.use(express.json())




if (mongoose.connect("mongodb+srv://gloria2001:gloria2001@cluster0.ipg35w1.mongodb.net/DentTechSolutionDB?retryWrites=true&w=majority&appName=Cluster0")) {
    console.log("MongoDb connected")
} else {
    console.log("MongoDb not connected")
}

const generatePassword = async (password) => {
    const salt = await bcrypt.genSalt(4)
    return bcrypt.hash(password, salt)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    },
});


const upload = multer({ storage });




//api for sign Up user
app.post("/signup", async (req, res) => {

    let input = req.body

    let hashedPassword = await generatePassword(input.password)
    console.log(hashedPassword)
    input.password = hashedPassword

    let users = new usermodel(input)
    users.save()
    res.json({ "status": "success" })

})




//api for sign In
app.post("/login", (req, res) => {

    let input = req.body
    usermodel.find({ "email": req.body.email }).then(
        (response) => {
            if (response.length > 0) {
                let dbPassword = response[0].password
                console.log(dbPassword)
                bcrypt.compare(input.password, dbPassword, (error, isMatch) => {
                    if (isMatch) {
                        jwt.sign({ email: input.email }, "dentTech-app", { expiresIn: "1d" },
                            (error, token) => {
                                if (error) {
                                    res.json({ "status": "unable to create token" })
                                } else {
                                    res.json({ "status": "success", "userid": response[0]._id, "token": token, "role": response[0].role, "name": response[0].name })
                                }
                            })
                    } else {
                        res.json({ "status": "incorrect password" })
                    }
                })
            }
            else {
                res.json({ "status": "user not found" })
            }
        }
    )
})

//Profile Api
// app.post("/Profile", async (req, res) => {

//     let input = req.body
//     let profile = await usermodel(input)
//     profile.save()
//     res.json({ "status": "added" })

// })

// Add order
// Update the /addorder route to handle image uploads
app.post("/addorder", upload.single('oral_scan'), async (req, res) => {
    try {
        // Validate the input data
        if (!req.body) {
            return res.status(400).json({ message: "No input data provided." });
        }

        // Create a new order document
        const orderData = {
            ...req.body,
            oral_scan: req.file ? req.file.path : null // Store the path of the uploaded image
        };

        console.log("Order Data:", orderData); // Log the order data

        let orders = new ordermodel(orderData);

        // Save the order to the database
        await orders.save();

        // Return a success response
        res.json({ "status": "added" });
    } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Your existing route
app.post("/viewOrders", (req, res) => {
    ordermodel.find()
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.status(500).json({ message: "Error fetching orders", error });
        });
});

//delete order by admin
app.post("/deleteOrder", (req, res) => {
    console.log("Delete order request received:", req.body); // Log the request body
    let input = req.body;
    ordermodel.findByIdAndDelete(input._id).then((response) => {
        if (response) {
            res.json({ "status": "deleted" });
        } else {
            res.status(404).json({ "status": "not found" });
        }
    }).catch((error) => {
        console.error("Error deleting order:", error);
        res.status(500).send("Error deleting order");
    });
});


app.get('/getTechnicians', async (req, res) => {
    try {
        const technicians = await usermodel.find();
        res.json(technicians);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching technicians' });
    }
});

// Endpoint to assign technician
app.post('/assignTechnician', async (req, res) => {
    try {
        const { orderId, technicianId } = req.body;
        const order = await ordermodel.findByIdAndUpdate(orderId, { technicianId }, { new: true });
        if (order) {
            res.json({ status: 'assigned' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error assigning technician' });
    }
});


app.post('/viewAssignedOrders', async (req, res) => {
    try {
        const { technicianId } = req.body;
        const assignedOrders = await ordermodel.find({ technicianId }); // Assuming your Order model has a technicianId field
        res.json(assignedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assigned orders' });
    }
});

//add product by user
app.post("/addproduct", upload.single('product_img'), async (req, res) => {
    try {
        // Validate the input data
        if (!req.body) {
            return res.status(400).json({ message: "No input data provided." });
        }

        // Create a new order document
        const productData = {
            ...req.body,
            product_img: req.file ? req.file.path : null // Store the path of the uploaded image
        };

        console.log("Product Data :", productData); // Log the order data

        let products = new productmodel(productData);

        // Save the order to the database
        await products.save();

        // Return a success response
        res.json({ "status": "added" });
    } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

app.post("/viewProduct",(req,res)=>{
    productmodel.find().then(
        (data)=>{
            res.json(data)
        }
    ).catch(
        (error)=>{
            res.json(error)
        }
    )
})
app.post("/deleteProduct", (req, res) => {

    let input = req.body
    productmodel.findByIdAndDelete(input._id).then(

        (response) => {
            res.json({"status":"deleted"})
         }

    ).catch(
        (error)=>{
            res.send("error")
        }
    )
})

app.get('/getProfile', async (req, res) => {
    try {
        const profile = await usermodel.findOne(); // Fetch the first profile (you may want to implement user authentication)
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

// Update profile data
app.post('/updateProfile', upload.single('profile_pic'), async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            profile_pic: req.file ? req.file.path : undefined, // Use the uploaded file path if available
        };

        await usermodel.updateOne({}, updatedData); // Update the first profile (you may want to implement user authentication)
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});



app.listen(8080, () => {

    console.log("Server started")

})