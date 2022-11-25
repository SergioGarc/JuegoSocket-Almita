const express = require("express");
const app = express();
const path = require("path");
const {v4: uudiv4} = require('uuid');
let usuarios = [];
let mensajes = [];
let partidas = [];

app.set('port', process.env.PORT  || 8080);

// static files
app.use(express.static(path.join(__dirname,'public')));

const Server = app.listen(app.get('port'), ()=>{
    console.log("Servidor conectado "+app.get('port'));
})

const SocketIo = require("socket.io");
const io = SocketIo(Server)

//web sockets
io.on("connection",(socket)=>{
    socket.on("login", (data)=>{
        usuarios.push({user: data.user, id: socket.id, jugando:false});
        io.to(socket.id).emit("login",{id:socket.id, mensajes})
    });
    socket.on("newmessage", (data)=>{
        mensajes.push(data)
        socket.broadcast.emit("newmessage", data)
    })

    socket.on("crearpartida", ()=>{
        usuarios.find(jug => jug.id == socket.id).jugando = true;
        let partida ={
            id: uudiv4(),
            estado: false,
            jugadores:[
                {
                    id: socket.id,
                    nombre: usuarios.find(jug => jug.id == socket.id).user,
                    jugadas: [],
                    gatote: [],
                    turno: true,
                    gatote: false
                }
            ]
        }
        partidas.push(partida);
        io.to(socket.id).emit("crearpartida",partida)
    });

    socket.on("conectarsepartida",(data)=>{
        let partida = partidas.find((p)=>{
            if(p.id === data.id && !p.estado) return p;
        })
        if(partida){
            usuarios.find(jug => jug.id == socket.id).jugando = true;
            let newj = {
                id: socket.id,
                nombre: usuarios.find(jug => jug.id == socket.id).user,
                jugadas: [],
                gatote: [],
                turno: false,
                gatote: false
            }
            partida.jugadores.push(newj);
            partida.jugadores.forEach(element => {
                io.to(element.id).emit("conectarsepartida",{
                    estado:true,
                    partida
                })
            });

        }else{
            io.to(socket.id).emit("conectarsepartida",{estado:false})
        }
    })
    socket.on("enviarjugada", (data)=>{
        partidas.forEach(par=>{
            if(par.id == data.id){
                    par.jugadores.find(e=>e.id == socket.id).jugadas = data.jugadas;
                    par.jugadores.forEach((hh)=>{
                        if(hh.id != socket.id){
                            io.to(hh.id).emit("enviarjugada", data)
                        }
                    })
            }
        })
    })

    socket.on("mandargatote", (data)=>{
        partidas.forEach(par=>{
            if(par.id == data.id){
                    par.jugadores.find(e=>e.id == socket.id).gatote = data.jugadasgatote;
                    par.jugadores.forEach((hh)=>{
                        if(hh.id != socket.id){
                            io.to(hh.id).emit("mandargatote", data)
                        }
                    })
            }
        })
    });

    socket.on("disconnect", ()=>{
        let user = usuarios.find((u)=>u.id ==socket.id);
        if(user){
            if(user.jugando){
                let partida = partidas.find((p)=>{
                    let ju = p.jugadores.find((jjj)=>jjj.id == socket.id);
                    if(ju) return p;
                })
                if(partida.jugadores.length == 1){
                    partidas =partidas.filter((p)=> p.id != partida.id);
                    usuarios = usuarios.filter((u)=>u.id !=socket.id);
                }else{
                    usuarios = usuarios.filter((u)=>u.id !=socket.id);
                    partidas =partidas.filter((p)=> p.id != partida.id);
                    partida.jugadores = partida.jugadores.filter((ju)=>ju.id!=socket.id);
                    partida.estado = false
                    partida.jugadores[0].turno = true
                    partidas.push(partida);
                    io.to(partida.jugadores[0].id).emit("disconect",{});
                }
            }else{
                usuarios = usuarios.filter((u)=>u.id !=socket.id);
            }
        }
    })
});