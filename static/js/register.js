document.addEventListener("DOMContentLoaded", function() {

    document.getElementById('registerForm').onsubmit = function(e) {
        e.preventDefault();

        const password = document.getElementById('reg_password').value;
        const confirmPassword = document.getElementById('reg_confirm_password').value;

        if (password !== confirmPassword) {
            return showToast('Паролі не збігаються!', 'error');
        }

        const body = {
            username: document.getElementById('reg_username').value,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('reg_email').value,
            password: password
        };

        const csrftoken = getCookie('csrftoken');

        fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(body)
        })
        .then(res => {
            if (res.ok) {
                showToast('Реєстрація успішна! Ласкаво просимо.');
                setTimeout(() => {
                    window.location.href = '/login/?next=/profile/';
                }, 1500);
            } else {
                return res.json().then(err => {
                    let errorMsg = 'Помилка при реєстрації.';
                    if (err.username) {
                        errorMsg = 'Такий логін вже існує.';
                    }
                    showToast(errorMsg, 'error');
                    console.error(err);
                });
            }
        })
        .catch(err => {
            showToast('Сталася помилка. Спробуйте пізніше.', 'error');
            console.error(err);
        });
    };
});