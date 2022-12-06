// configurações do express
// carregando modulos
const express = require('express');
const handlebars = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');
//pegando rotas adimin
const admin = require('./routs/admin');
//trabalhando com diretórios
const path = require('path');
//const { default: mongoose } = require('mongoose');
const mongoose = require('mongoose');
//express session
const session = require('express-session')
const flash = require('connect-flash')
//model de postagm
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
//model categorias listar
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
//usuario
const usuarios = require ('./routs/usuario')
//pasta config
const passport = require('passport')
require('./config/auth')(passport)
// configurações
    // session midleware
        app.use(session({
            secret:'cursodenode',
            resave:true,
            saveUninitialized: true
        }))

        app.use(passport.initialize())
        app.use(passport.session())

        app.use(flash())
        //midleware
        app.use((req,res,next)=>{
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error')
            res.locals.user = req.user || null;
            next();
        })
    //body parser
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    //handlebars
    const hbs = handlebars.create({
        defaultLayout: "main"
    })
    app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');
    //mongoose
    mongoose.connect("mongodb+srv://app_test:clarice21@Cluster0.184n6.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=>{
        console.log("DB connected")
    }).catch(()=>{
        console.log("DB connection failed")
    })

//rotas
    app.get('/', (req,res)=>{
        Postagem.find().populate('categoria').sort({data:'desc'}).lean().then((postagens)=>{
            res.render('index', {postagens: postagens})
        }).catch((err)=>{
            req.flash('error_msg', 'Houve um erro interno')
            res.redirect('/404')
        })
    })
    app.get('/404',(req,res)=>{
        res.send('Erro 404!')
    })
    //usuario
   app.use('/usuarios', usuarios)

    app.get("/postagem/:slug", (req,res)=>{
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem)=>{
            if(postagem){
                res.render('postagem/index', {postagem: postagem})
            } else{
                req.flash('error_msg','Esta postagem não existe')
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash('error_msg','Houve um problema interno')
            req.redirect('/')
        })
    })
    app.use('/admin', admin)
//public referencia dos arquivos estáticos, caminho absoluto
    app.use(express.static(path.join(__dirname,'public')))
    app.use((req,res,next)=>{
        next()
    })
    //categorias listar
    app.get('/categorias', (req,res)=>{
        Categoria.find().lean().then((categorias)=>{
            res.render('categorias/index', {categorias: categorias})

        }).catch((err)=>{
            req.flash('error_msg','Houve um problema interno ao listar as categorias')
            res.redirect('/')
        })
    })
    //categorias redirect
    app.get('/categorias/:slug', (req,res)=>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria)=>{
            if(categoria){

                Postagem.find({categoria: categoria._id}).lean().then((postagens)=>{
                    res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
                }).catch((err)=>{
                    req.flash('error_msg', 'Houve um erro ao listar os posts')
                    req.redirect('/')
                })
            }else{
                req.flash('error_msg', 'Esta categoria não existe')
                res.rredirect('/')
            }

            
        }).catch((error)=>{
            req.flash('error_msg','Houve um erro interno ao carregar a página desta categoria')
            res.redirect('/')
        })
    })

//outros
const PORT  = process.env.PORT || 3000;
app.listen(port, ()=> {
    console.log(`A aplicação está rodando no endereço http://localhost:${port}`);
})