var sendForm = document.querySelector('#chatform'),
    textInput = document.querySelector('.chatbox'),
    chatList = document.querySelector('.chatlist'),
    userBubble = document.querySelectorAll('.userInput'),
    animateBotBubble = document.querySelectorAll('.bot__input--animation'),
    chatbotButton = document.querySelector(".submit-button"),
    cpar = document.getElementById("cpar"),
    esperando = document.getElementById("esperando"),
    g1 = document.getElementById("g1"),
    g2 = document.getElementById("g2"),
    g3 = document.getElementById("g3"),
    g4 = document.getElementById("g4"),
    g5 = document.getElementById("g5"),
    g6 = document.getElementById("g6"),
    g7 = document.getElementById("g7"),
    g8 = document.getElementById("g8"),
    g9 = document.getElementById("g9");

    const socket = io();
    let idsocket = "";
    let loggeado = false;
    let nomusu;
    let partida=null;
    let turno = false;
    let gatote = false;
    let totaldejugadas = 0;
    let totaldegatote= 0;
    let jugadas = [false,false,false,false,false,false,false,false,false];
    let jugadasrival = [false,false,false,false,false,false,false,false,false];
    let jugadasgatote = [false,false,false,false,false,false,false,false,false];
    let jugadasgatoterial = [false,false,false,false,false,false,false,false,false];
    let empate;
    let reaction = document.getElementById("reaction");

sendForm.onkeydown = function(e){
    if(e.keyCode == 13){
        e.preventDefault();
        var input = textInput.value;
        textInput.value = ""
        if(input.length > 0) {
            Mensajeusuario(input)
        }
        
    }
};

function Mensajeusuario(texto){
    var chatBubble = document.createElement('li');
    chatBubble.classList.add('userInput');
    chatBubble.innerHTML = texto;
    chatList.appendChild(chatBubble)
    setTimeout(function(){
        chatList.scrollTop = chatList.scrollHeight;
    }, 0)
    socket.emit("newmessage", {
            nombre: nomusu,
            mensaje: texto
        })
}

function Mensajeotrousuario(mensaje){
    var response = document.createElement('li');
    response.classList.add("bot__output");
    response.innerHTML = mensaje;
    chatList.appendChild(response);
    animateBotOutput();
    setTimeout(function(){
        chatList.scrollTop = chatList.scrollHeight;
    }, 0)
}

sendForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var input = textInput.value;
    textInput.value = ""
    if(input.length > 0) {
        Mensajeusuario(input)
    }
}) //end of eventlistener


//change to SCSS loop
function animateBotOutput() {
    chatList.lastElementChild.style.animationDelay= "100ms";
    chatList.lastElementChild.style.animationPlayState = "running";
}

function CrearPartida(){
    socket.emit("crearpartida",{});
}

socket.on("crearpartida", (data)=>{
    cpar.style.display = "none";
    esperando.style.display = "inline-block";
    document.getElementById("idpart").innerHTML = "ID: "+ data.id;
    partida = data
})


function jugada(num){
    
    if(turno && !jugadasrival[num-1] && !jugadas[num-1]){
        jugadas[num-1]=true;
        marcarjugada(num, "X");
        turno = false;
        mandarjugada();
    }else if(gatote && !jugadasgatote[num-1] && !jugadasgatoterial[num-1]){
        jugadasgatote[num-1]= true;
        gatote = false;
        marcarjugada(num, "X");
        mandargatote();
    }
}

function mandarjugada(){
    totaldejugadas++;
    let win = comprobarganar(jugadas);
    if(totaldejugadas==9 && !win) empate= true;
    socket.emit("enviarjugada",{
        id:  partida.id,
        jugadas: jugadas,
        win,
        empate
    });
    if(win){
        setTimeout(()=>{
            totaldejugadas = 0;
            reaction.src = "./img/img6.png"
            gatote=true;
            document.getElementById("nomtipo").innerHTML = "Gatote grandote";
            limpiargatote();
        },1000)
    }else if(empate){
        empate = false;
        totaldejugadas = 0;
        reaction.src = "./img/img8.png"
        setTimeout(()=>{
            limpearTablero();
            reaction.src = "./img/img1.png"
        },1500)
    }else{
        reaction.src = "./img/img1.png"
    }
}

socket.on("enviarjugada", (data)=>{
    totaldejugadas ++;
    if(data.win){
        totaldejugadas = 0;
        setTimeout(()=>{
            reaction.src = "./img/img7.png"
            document.getElementById("nomtipo").innerHTML = "Gatote grandote";
            limpiargatote();
        },1000)
    }else if(data.empate){
        totaldejugadas = 0;
        reaction.src = "./img/img8.png"
        setTimeout(()=>{
            limpearTablero();
            reaction.src = "./img/img2.png"
            turno= true;
        },1500)
    }else{
        jugadasrival = data.jugadas
        colocargatochiquito();
        reaction.src = "./img/img2.png"
        turno = true;
    }
});


function mandargatote(){
    totaldegatote++;
    let win = comprobarganar(jugadasgatote);
    if(totaldegatote==9 && !win) empate= true;
    socket.emit("mandargatote",{
        id: partida.id,
        jugadasgatote,
        win,
        empate
    });
    if(win){
        reaction.src = "./img/img4.png"
        document.getElementById("nomtipo").innerHTML = "Ganaste";
    }else if(empate){
        reaction.src = "./img/img8.png"
        document.getElementById("nomtipo").innerHTML = "Empapte";
    }else{
        setTimeout(()=>{
            document.getElementById("nomtipo").innerHTML = "Gato chiquito";
            turno = false;
            limpearTablero();
        },1000)
        
    }
}

socket.on("mandargatote", (data)=>{
    totaldegatote++;
    if(data.win){
        reaction.src = "./img/img4.png"
        document.getElementById("nomtipo").innerHTML = "Ganaste";
    }else if(data.empate){
        reaction.src = "./img/img8.png"
        document.getElementById("nomtipo").innerHTML = "Empate";
    }else{
        jugadasgatoterial = data.jugadasgatote
        limpiargatote()
        setTimeout(()=>{
            document.getElementById("nomtipo").innerHTML = "Gato chiquito";
            turno = true;
            limpearTablero();
        },1000)
    }
});


function login(){
    let user = document.getElementById("username").value;
    if(user.length>0){
        socket.emit("login",{user})
        nomusu = user
        loggeado = true
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ingresa un nombre de usuario'
        })
    }
}

socket.on("login", (data)=>{
    idsocket = data.id
    document.getElementById("div1").style.display = "none";
    document.getElementById("div2").style.display = "block";
    document.getElementById("divpartida").style.display = "none";
    document.getElementById("divreactions").style.display = "node";
    document.getElementById("chat").style.display = "inline-block";
    document.getElementById("cpar").style.display = "inline-block";
    mostrarmensajes(data.mensajes)
});

function mostrarmensajes(mensajes){
    mensajes.forEach(element => {
        let men = element.nombre + ": "+ element.mensaje
        Mensajeotrousuario(men)
    });
}


socket.on("newmessage", (data)=>{
    if(!partida && loggeado){
        let men = data.nombre + ": "+ data.mensaje
        Mensajeotrousuario(men) 
    }
    
});

function uniserpartida(){
    let idpart = document.getElementById("partida").value;
    if(idpart.length>0){
        socket.emit("conectarsepartida",{id:idpart});
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ingresa un id de partida'
        })
    }
}


socket.on("conectarsepartida", (data)=>{
    if(data.estado){
        partida = data.partida
        document.getElementById("divpartida").style.display = "inline-block";
        document.getElementById("divreactions").style.display = "inline-block";
        document.getElementById("chat").style.display = "none";
        document.getElementById("esperando").style.display = "none";
        document.getElementById("cpar").style.display = "none";

        document.getElementById("nombresjug").innerHTML= partida.jugadores[0].nombre+ " vs " +partida.jugadores[1].nombre
        turno = partida.jugadores.find((j)=> j.id == idsocket).turno;
        document.getElementById("nomtipo").innerHTML = "Gato chiquito";
        limpearTablero();
        totaldejugadas = 0;
        totaldegatote= 0;
        jugadasgatote = [false,false,false,false,false,false,false,false,false];
        jugadasgatoterial = [false,false,false,false,false,false,false,false,false];
        if(turno){
            reaction.src = "./img/img2.png"
        }else{
            reaction.src = "./img/img1.png"
        }
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'La partida ingresada no existe'
        })
    }
})


function comprobarganar(listajugadas = []){
    if(listajugadas[0]&&listajugadas[1]&&listajugadas[2])return true;
    if(listajugadas[3]&&listajugadas[4]&&listajugadas[5])return true;
    if(listajugadas[6]&&listajugadas[7]&&listajugadas[8])return true;
    if(listajugadas[0]&&listajugadas[3]&&listajugadas[6])return true;
    if(listajugadas[1]&&listajugadas[4]&&listajugadas[7])return true;
    if(listajugadas[2]&&listajugadas[5]&&listajugadas[8])return true;
    if(listajugadas[0]&&listajugadas[4]&&listajugadas[8])return true;
    if(listajugadas[4]&&listajugadas[2]&&listajugadas[6])return true;

    return false;
}


function marcarjugada(num, letra){
    if(num==1)g1.innerHTML= letra;
    if(num==2)g2.innerHTML= letra;
    if(num==3)g3.innerHTML= letra;
    if(num==4)g4.innerHTML= letra;
    if(num==5)g5.innerHTML= letra;
    if(num==6)g6.innerHTML= letra;
    if(num==7)g7.innerHTML= letra;
    if(num==8)g8.innerHTML= letra;
    if(num==9)g9.innerHTML= letra;
}

function limpiargatote(){
    for(let i=0; i<9; i++){
        let letra="";
        if(jugadasgatote[i]){
            letra = "X"
        }else if(jugadasgatoterial[i]){
            letra = "O"
        }
        if(i==0)g1.innerHTML= letra;
        if(i==1)g2.innerHTML= letra;
        if(i==2)g3.innerHTML= letra;
        if(i==3)g4.innerHTML= letra;
        if(i==4)g5.innerHTML= letra;
        if(i==5)g6.innerHTML= letra;
        if(i==6)g7.innerHTML= letra;
        if(i==7)g8.innerHTML= letra;
        if(i==8)g9.innerHTML= letra;
    }
}

function colocargatochiquito(){
    for(let i=0; i<9; i++){
        let letra="";
        if(jugadas[i]){
            letra = "X"
        }else if(jugadasrival[i]){
            letra = "O"
        }
        if(i==0)g1.innerHTML= letra;
        if(i==1)g2.innerHTML= letra;
        if(i==2)g3.innerHTML= letra;
        if(i==3)g4.innerHTML= letra;
        if(i==4)g5.innerHTML= letra;
        if(i==5)g6.innerHTML= letra;
        if(i==6)g7.innerHTML= letra;
        if(i==7)g8.innerHTML= letra;
        if(i==8)g9.innerHTML= letra;
    }
}


function limpearTablero(){
    jugadas = [false,false,false,false,false,false,false,false,false];
    jugadasrival = [false,false,false,false,false,false,false,false,false];
    g1.innerHTML= "";
    g2.innerHTML= "";
    g3.innerHTML= "";
    g4.innerHTML= "";
    g5.innerHTML= "";
    g6.innerHTML= "";
    g7.innerHTML= "";
    g8.innerHTML= "";
    g9.innerHTML= "";
    if(turno){
        reaction.src = "./img/img2.png"
    }else{
        reaction.src = "./img/img1.png"
    }
}


socket.on("disconect",()=>{
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'El otro jugador se ha desconectado'
    });
    document.getElementById("divpartida").style.display = "none";
    document.getElementById("divreactions").style.display = "none";
    document.getElementById("chat").style.display = "inline-block";
    document.getElementById("esperando").style.display = "inline-block";
    document.getElementById("idpart").innerHTML = "ID: "+ partida.id;
})
