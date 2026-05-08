document.addEventListener("DOMContentLoaded", function() {

    // Надійна функція отримання токена
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

    function calculateBMI(weight, height) {
        if (!weight || !height || height === 0) return "--";
        const hMeters = height / 100;
        return (weight / (hMeters * hMeters)).toFixed(1);
    }

    // 1. ЗАВАНТАЖЕННЯ ДАНИХ
    fetch('/api/profile/')
        .then(res => res.json())
        .then(data => {
            console.log("Дані отримано:", data); // Для відладки в консолі

            // Заповнюємо текстові блоки зверху
            const fullName = (data.first_name || 'Користувач') + ' ' + (data.last_name || '');
            document.getElementById('display_full_name').innerText = fullName;
            document.getElementById('display_weight').innerText = data.current_weight || '--';
            document.getElementById('display_height').innerText = data.height || '--';
            document.getElementById('display_age').innerText = data.age || '--';
            document.getElementById('display_bmi').innerText = calculateBMI(data.current_weight, data.height);

            // Заповнюємо поля форми знизу
            document.getElementById('first_name').value = data.first_name || '';
            document.getElementById('last_name').value = data.last_name || '';
            document.getElementById('gender').value = data.gender || 'M';
            document.getElementById('birth_date').value = data.birth_date || '';
            document.getElementById('height').value = data.height || '';
            document.getElementById('current_weight').value = data.current_weight || '';
            document.getElementById('target_weight').value = data.target_weight || '';
            document.getElementById('goal').value = data.goal || 'maintain';
            document.getElementById('activity_level').value = data.activity_level || 'sedentary';
        })
        .catch(err => {
            console.error("Помилка завантаження:", err);
            showToast("Не вдалося завантажити дані профілю", "error");
        });

    // 2. ЗБЕРЕЖЕННЯ ДАНИХ
    document.getElementById('profileForm').onsubmit = function(e) {
        e.preventDefault();

        const csrftoken = getCookie('csrftoken');
        const curWeight = parseFloat(document.getElementById('current_weight').value);
        const tarWeight = parseFloat(document.getElementById('target_weight').value);
        const heightVal = parseFloat(document.getElementById('height').value);
        const goal = document.getElementById('goal').value;

        // Валідація
        if (heightVal < 50 || heightVal > 300) return showToast('Введіть реальний зріст', 'error');
        if (goal === 'cut' && tarWeight >= curWeight) return showToast('Цільова вага має бути меншою за поточну', 'error');
        if (goal === 'bulk' && tarWeight <= curWeight) return showToast('Цільова вага має бути більшою за поточну', 'error');

        const profileBody = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            gender: document.getElementById('gender').value,
            birth_date: document.getElementById('birth_date').value,
            height: heightVal,
            target_weight: tarWeight,
            goal: goal,
            activity_level: document.getElementById('activity_level').value
        };

        // Записуємо вагу в лог, потім оновлюємо профіль
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
                showToast('Зміни збережено!');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Помилка при збереженні', 'error');
            }
        });
    };
});