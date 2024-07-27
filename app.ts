import { any } from "webidl-conversions";

const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const app = express();

mongoose.connect('mongodb://localhost:27017/Birthday')
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch((err:string) => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })
    
const schema = new mongoose.Schema({
    name: String,
    date: String
})
const Data = mongoose.model('Date', schema)

app.set('view engine', 'ejs');
    
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(methodOverride('_method'))    

app.listen(3000, () => {
    console.log('Server Activated')
})

app.get('/', (req:any,res:any) => {
    console.log('This is the homepage')
    res.render('show')
})
app.get('/update',(req:(any),res:(any))=>{
    res.render('update')
})
app.patch('/',(req:(any),res:(any))=>{
    const {name,date} = req.body
    const info = Data.findOneAndUpdate({name:name},{date:date},{runValidators:true,new:true})
    
    .then((d:any)=>{
        res.redirect('/')
    })
})

app.post('/', (req:(any),res:(any)) => {
    const {name,date} = req.body
    const newData = new Data({name:name,date:date})
    newData.save()
    console.log(newData)
    res.redirect('/')
})
app.get('/delete',(req:(any),res:(any))=>{
    res.render('delete')
})
app.delete('/',(req:(any),res:(any))=>{
    const {name,date} = req.body
    Data.deleteMany({name:name})
        .then()
    res.redirect('/')
})

function calculateAge(birthDate:number) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const birthMonth = birth.getMonth();
    const todayMonth = today.getMonth();
    const birthDay = birth.getDate();
    const todayDay = today.getDate();
    
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
        age--;
    }
    
    return age;
}

app.get('/view', (req:any,res:any) => {
    Data.find({})
        .then((d:any) => {
            const today = new Date();
            const dataWithAgeAndBirthday = d.map((person:any) => {
                const age = calculateAge(person.date);
                const birthdate = new Date(person.date);
                
                birthdate.setUTCFullYear(today.getUTCFullYear());

                if (birthdate < today) {
                    birthdate.setUTCFullYear(today.getUTCFullYear() + 1);
                }

                const nextBirthday = birthdate;
                return {
                    name: person.name,
                    birthdate: person.date,
                    age: age,
                    nextBirthday: nextBirthday
                };
            });

            dataWithAgeAndBirthday.sort((a:any, b:any) => {
                return a.nextBirthday - b.nextBirthday;
            });

            const closestBirthday = dataWithAgeAndBirthday.length > 0 ? dataWithAgeAndBirthday[0].nextBirthday : null;
            const closestName = dataWithAgeAndBirthday.length > 0 ? dataWithAgeAndBirthday[0].name : '';

            res.render('view', { 
                dataWithAge: dataWithAgeAndBirthday, 
                closestBirthday: closestBirthday,
                closestName: closestName 
            });
        })
        .catch((err:string) => {
            console.log(err); 
            res.status(500).send('Error fetching data');
        });
});
app.post('/search', (req:any,res:any) => {
    const { search } = req.body;
    Data.find({ name: search })
        .then((d:[]) => {
            const dataWithAge = d.map((person:any) => {
                const age = calculateAge(person.date);
                return {
                    name: person.name,
                    birthdate: person.date,
                    age: age
                };
            });
            res.render('search', { dataWithAge });
        })
        .catch((err:String) => {
            console.log(err); 
            res.status(500).send('Error fetching data');
        });
});


app.get('*', (req:any,res:any) => {
    res.send("Can't find anything on that!!")
})

