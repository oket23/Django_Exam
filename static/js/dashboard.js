document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/dashboard/')
        .then(response => {
            if (!response.ok) {
                document.querySelector('.container').innerHTML = `
                    <div class="card" style="text-align: center; border-left: 5px solid #e74c3c;">
                        <h2 style="color: #e74c3c;">Необхідна авторизація!</h2>
                        <p>Будь ласка, увійди в систему, щоб побачити свій дашборд.</p>
                        <a href="/login/" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2ecc71; color: white; text-decoration: none; border-radius: 5px;">Увійти</a>
                    </div>`;
                throw new Error('Не авторизовано');
            }
            return response.json();
        })
        .then(data => {
            if (data.profile && data.profile.is_complete === false) {
                showToast('Будь ласка, заповни профіль для точних розрахунків', 'error');
            }

            document.getElementById('goals-card').innerHTML = `
                <h3>Цілі на сьогодні</h3>
                <p>Калорії: <span class="highlight">${data.dynamic_goals_today.target_calories} ккал</span></p>
                <p>БЖВ: Білки <b>${data.dynamic_goals_today.target_protein}г</b> | Жири <b>${data.dynamic_goals_today.target_fat}г</b> | Вуглеводи <b>${data.dynamic_goals_today.target_carbs}г</b></p>
                <p>Норма води: <span class="highlight">${data.dynamic_goals_today.target_water} мл</span></p>
            `;

            document.getElementById('progress-card').innerHTML = `
                <h3>Прогрес за день</h3>
                <p>Спожито їжі: <span class="highlight">${data.today_summary.consumed_calories} ккал</span></p>
                <p>Спалено активністю: <span class="highlight">${data.today_summary.burned_calories} ккал</span></p>
                <p>Випито води: <span class="highlight">${data.today_summary.consumed_water} мл</span></p>
            `;

            const history = data.charts.weight_history;
            if (history && history.length > 0) {
                const labels = history.map(item => item.date);
                const weights = history.map(item => item.weight);

                Chart.defaults.color = '#b0b0b0';
                Chart.defaults.borderColor = '#333';

                const ctx = document.getElementById('weightChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Вага тіла (кг)',
                            data: weights,
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.2)',
                            borderWidth: 3,
                            pointBackgroundColor: '#1e1e1e',
                            pointBorderColor: '#2ecc71',
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                min: Math.min(...weights) - 2,
                                max: Math.max(...weights) + 2
                            }
                        }
                    }
                });
            }
        })
        .catch(error => console.log('Логіку зупинено:', error));
});