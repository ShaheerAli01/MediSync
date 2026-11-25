const express = require("express");


const cors = require("cors");
const app = express();

const port = 3000;

app.use(cors());
app.use(express.json());
/*
app.get(`/`, (req, res) => {
    res.json({
        email: "john.doe.453@gmail.com",
        password: "I_exist123",
        age: 20,
        firstName: "John",
        lastName: "Doe",
        doctor: "Mr. Smith"
    });
})
*/

/*
function MS_Listen() {
    app.listen(port, () => {
        console.log(`Server is listenting on ${port}`);
    })
}*/

//MS_Listen();

let userDatabase = [{id: 1, email: "jeff.paterson23@gmail.com", password: "20L67KG112", firstName: "Jeff", lastName: "Paterson"}];
let nextId = 2;
//not permanent database, resets when server restarts

//user creation
function MS_Post() {
    app.post("/users",(req, res)=>{
        const {email, password, firstName, lastName} = req.body;

        if(!email || !password || !firstName || !lastName){
            return res.status(400).json({error: `Not all of the required fields have been filled out.`});
        }

        const newUser = {
            id: nextId,
            email,
            password,
            firstName,
            lastName
        };

        //console.log(MSuser.email)

        userDatabase.push(newUser);
        nextId++;
        return res.status(201).json({message:`New user created successfully!`});
    });
}

//User account removal
function MS_Delete(req) {
    app.delete("/users/:id",(req, res)=>{
        const userId = parseInt(req.params.id);

        //finds the user in the database via id #
        const userIndex = userDatabase.findIndex(user => user.id === userId);

        if(userIndex === -1){
            return res.status(404).json({error:`User ${userId} not found in database.`});
        }

        userDatabase.splice(userIndex,1);

        return res.status(200).json({message:`User ${userId} deleted successfully!`});
    });
}

//view user 
function MS_Get(req) {
    app.get("/users", (req, res)=>{
        return res.status(200).json(userDatabase)
    })

    app.get(`/users/:id`, (req,res)=>{
        const userId = parseInt(req.params.id);
        const userIndex = userDatabase.findIndex(user => user.id === userId);
        const user = userDatabase.find(user=>user.id === userId)
        if(userIndex === -1){
            return res.status(404).json({error:`User ${userId} not found in database.`});
        }
        return res.status(200).json(user);
        //return res.status(200).json(userDatabase);
    });
}

MS_Post()
//MS_Listen()
MS_Get()
MS_Delete()

module.exports ={
    MS_Post,
    //MS_Listen,
    MS_Get,
    MS_Delete
};

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`);

});

//MS_Listen();