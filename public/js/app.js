/**
 * Se nenhuma configuração foi definida, use o banco de teste
 * */
window.firebaseConfig = window.firebaseConfig || {
    apiKey: "AIzaSyDXFQauPLiEfHh-6g-LJmEjKG12kkLwLCc",
    authDomain: "cytech-easyproof.firebaseapp.com",
    databaseURL: "https://cytech-easyproof.firebaseio.com",
    projectId: "cytech-easyproof",
    storageBucket: "cytech-easyproof.appspot.com",
    messagingSenderId: "115762890545",
    appId: "1:115762890545:web:ca27001dc9e76f03"
};

firebase.initializeApp(window.firebaseConfig);

firebase.auth.Auth.Persistence.LOCAL;

$("#btn-login").click(function(){

    var email = $("#email").val();
    var password = $("#password").val();

    var result = firebase.auth().signInWithEmailAndPassword(email, password);

    result.catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log(errorCode);
        console.log(errorMessage);
    });

});

$("#btn-logout").click(function(){
    firebase.auth().signOut();
});

function switchView(view){
    $.get({
        url:view,
        cache: false,
    }).then(function(data){
        $("#container").html(data);
    });
}