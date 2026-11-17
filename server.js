const express = require("express");
const app = express();

const port = 3000;
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
function MS_Listen() {
    app.listen(port, () => {
        console.log(`Server is listenting on ${port}`);
    })
}

MS_Listen();

let userDatabase = [{id: 1, email: "jeff.paterson23@gmail.com", password: "20L67KG112", firstName: "Jeff", lastName: "Paterson"}];
let nextId = 2;

//user creation
export function MS_Post(MSuser) {
    app.post("/users",(req, res)=>{
        const {email, password, firstName, lastName} = req.body;

        if(!email || !password || !firstName || !lastName){
            return res.status(400).json({error: `Not all of the required fields have been filled out.`});
        }

        const newUser = MSuser;/*{
            id: nextId,
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName
        };*/

        console.log(MSuser.email)

        userDatabase.push(newUser);
        nextId++;
        return res.status(201).json({message:`New user created successfully!`});
    });
}

//User account removal
export function MS_Delete(req) {
    app.delete("/user/:id",(req, res)=>{
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
export function MS_Get(req) {
    app.get(`/users`, (req,res)=>{
        const userId = parseInt(req.params.id);
        const userIndex = userDatabase.findIndex(user => user.id === userId);
        if(userIndex === -1){
            return res.status(404).json({error:`User ${userId} not found in database.`});
        }
        return userDatabase.userIndex;
        //return res.status(200).json(userDatabase);
    });
}

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`);

});