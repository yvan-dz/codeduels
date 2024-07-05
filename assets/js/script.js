document.addEventListener("DOMContentLoaded", function() {
    loadRandomExercise();
});

function loadRandomExercise() {
    fetch('assets/js/exercises.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.length);
            const exercise = data[randomIndex];
            document.getElementById('exercise-title').innerText = exercise.title;
            document.getElementById('exercise-description').innerText = exercise.description;
        })
        .catch(error => console.error('Error loading exercises:', error));
}
