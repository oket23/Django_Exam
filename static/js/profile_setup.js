document.addEventListener("DOMContentLoaded", function() {

    fetch('/api/profile/')
        .then(res => {
            if (!res.ok) throw new Error('Помилка авторизації');
            return res.json();
        })
        .then(data => {
            console.log("Отримані дані профілю:", data);

            const fillField = (id, value) => {
                const el = document.getElementById(id);
                if (el && value !== undefined && value !== null) el.value = value;
            };

            fillField('first_name', data.first_name);
            fillField('last_name', data.last_name);
            fillField('gender', data.gender);
            fillField('birth_date', data.birth_date);
            fillField('height', data.height);
            fillField('current_weight', data.current_weight);
            fillField('target_weight', data.target_weight);
            fillField('goal', data.goal);
            fillField('activity_level', data.activity_level);
        })
        .catch(err => console.error('Помилка завантаження:', err));

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    document.getElementById('profileForm').onsubmit = function(e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        const curWeight = parseFloat(document.getElementById('current_weight').value);
        const tarWeight = parseFloat(document.getElementById('target_weight').value);
        const heightVal = parseFloat(document.getElementById('height').value);
        const goal = document.getElementById('goal').value;

        if (heightVal < 50 || heightVal > 300) {
            return showToast('Будь ласка, введіть реальний зріст (від 50 до 300 см).', 'error');
        }
        if (goal === 'cut' && tarWeight >= curWeight) {
            return showToast('Для схуднення ціль має бути нижчою за поточну вагу!', 'error');
        }
        if (goal === 'bulk' && tarWeight <= curWeight) {
            return showToast('Для набору маси ціль має бути вищою за поточну вагу!', 'error');
        }
        if (goal === 'maintain' && tarWeight !== curWeight) {
            return showToast('Для підтримки ціль має дорівнювати поточній вазі!', 'error');
        }

        const profileBody = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            gender: document.getElementById('gender').value,
            birth_date: document.getElementById('birth_date').value,
            height: document.getElementById('height').value,
            target_weight: tarWeight,
            goal: goal,
            activity_level: document.getElementById('activity_level').value
        };

        fetch('/api/weight/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrftoken},
            body: JSON.stringify({ weight: curWeight, date: new Date().toISOString().split('T')[0] })
        })
        .then(() => {
            return fetch('/api/profile/', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrftoken},
                body: JSON.stringify(profileBody)
            });
        })
        .then(res => {
            if (res.ok) {
                showToast('Дані успішно оновлено!');
            } else {
                return res.json().then(err => {
                    const msg = err.target_weight ? err.target_weight[0] :
                               (err.height ? err.height[0] :
                               (err.birth_date ? err.birth_date[0] : 'Помилка валідації'));
                    showToast(msg, 'error');
                });
            }
        })
        .catch(err => showToast('Сталася помилка при збереженні.', 'error'));
    };
});