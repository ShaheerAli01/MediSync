const BannedChars = [" ", "!", ".", "?", ",", "@", "#", "$", "%", "&", "(", ")", "*", "/", ";", ":"]

//All accounts start with either a U for user or D for doctor.
//Once the app is a little more built out with doctor and patient views
//we can use the prefix to send you to either page.
//The current system is not the most secure and would need to be changed
//and would require a Node.js server to test if this were to go live.
const TestAccounts = ["Ddrtest IamD0ct0r", "UJimbo_Pills GetMeMyAdderal123"]

let LastPage = "";

const UsernameBox = document.createElement("input");
UsernameBox.type = "text";
UsernameBox.placeholder = "Username               ";
document.body.appendChild(UsernameBox);
let UserName = "";

const PasswordBox = document.createElement("input");
PasswordBox.type = "text";
PasswordBox.placeholder = "Password               ";
document.body.appendChild(PasswordBox);
let PassWord = "";

const UNBox = document.getElementById("usernamebox");
    UNBox.appendChild(UsernameBox);
const PWBox = document.getElementById("passwordbox");
    PWBox.appendChild(PasswordBox);

document.getElementById('LoginButton').addEventListener('click', () => {
    UserName = UsernameBox.value;
    PassWord = PasswordBox.value;
    let HasBChar = BannedChars.some(char => UserName.includes(char));
    if (HasBChar) {
        window.alert("Warning, your username uses one or more invalid characters.\nYou may not use spaces or these characters in usernames or passwords:\n. , ? ! @ # $ % & * ( ) : ; / [ ]");
        return;
    }

    HasBChar = BannedChars.some(char => PassWord.includes(char));
    if (HasBChar) {
        window.alert("Warning, your password uses one or more invalid characters.\nYou may not use spaces or these characters in usernames or passwords:\n. , ? ! @ # $ % & * ( ) : ; / [ ]");
        return;
    }

    let UserExist = false;
    let PWMiss = false;
    for (i = 0; i < TestAccounts.length; i++) {
        let AccInf = TestAccounts[i].substring(1)
        let AccSpc = AccInf.indexOf(" ")
        //console.log(AccInf.substring(0,AccSpc));
        //console.log(AccInf.substring(AccSpc+1));
        if (AccInf.substring(0,AccSpc) == UserName) {
            UserExist = true;
            if (AccInf.substring(AccSpc+1) != PassWord) {
                PWMiss = true;
            }
            break;
        }
    }

    if (UserExist) {
        if (PWMiss) {
            window.alert("The username or password you entered is incorrect.");
            console.log("Incorrect Password");
        } else {
            console.log("User Accepted")
            //Go to previous page
        }
    } else {
        window.alert("The username or password you entered is incorrect.");
    }
    
});