const btnIrARegistro = document.getElementById('btnIrARegistro');
const btnIrALogin = document.getElementById('btnIrALogin');
const mainContainer = document.getElementById('mainContainer');
const body = document.body;

// Cuando hacen clic en "Regístrate aquí"
btnIrARegistro.addEventListener('click', (e) => {
    e.preventDefault(); 
    mainContainer.classList.add('modo-registro');
    body.classList.add('modo-registro');
});

// Cuando hacen clic en "Inicia sesión"
btnIrALogin.addEventListener('click', (e) => {
    e.preventDefault();
    mainContainer.classList.remove('modo-registro');
    body.classList.remove('modo-registro');
});
